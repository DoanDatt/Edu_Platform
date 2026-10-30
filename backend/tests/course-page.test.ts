import { beforeAll, describe, expect, it } from 'vitest'
import {
  Account,
  api,
  bearer,
  createCategory,
  createInstructor,
  createPublishedCourse,
  lastEmailTo,
  loginAdmin,
  registerStudent,
  uniqueEmail,
} from './helpers'

// Trang danh sách (cột lọc nhiều lựa chọn), trang chi tiết (bình luận, số liệu giảng viên) và form liên hệ
let admin: Account
let instructor: Account
let categoryA: number
let categoryB: number
let courseA: number
let courseB: number

beforeAll(async () => {
  admin = await loginAdmin()
  instructor = await createInstructor(admin)
  categoryA = await createCategory(admin)
  categoryB = await createCategory(admin)
  courseA = (await createPublishedCourse(instructor, admin, { categoryId: categoryA })).courseId
  courseB = (await createPublishedCourse(instructor, admin, { categoryId: categoryB })).courseId
})

describe('Lọc nhiều lựa chọn', () => {
  it('categoryId nhận danh sách "a,b" và vẫn nhận 1 giá trị như cũ', async () => {
    const both = await api().get(`/courses?categoryId=${categoryA},${categoryB}&limit=100`).expect(200)
    const ids = both.body.data.map((c: { id: number }) => c.id)
    expect(ids).toEqual(expect.arrayContaining([courseA, courseB]))

    const single = await api().get(`/courses?categoryId=${categoryA}&limit=100`).expect(200)
    expect(single.body.data.map((c: { id: number }) => c.id)).toEqual([courseA])
  })

  it('instructorId lọc theo giảng viên', async () => {
    const res = await api().get(`/courses?instructorId=${instructor.id}&limit=100`).expect(200)
    expect(res.body.totalItems).toBe(2)
  })

  it('rating lọc theo mức sao (điểm trung bình làm tròn)', async () => {
    const student = await registerStudent()
    await api().post('/enrollments').set(bearer(student.token)).send({ courseId: courseA }).expect(201)
    await api().post('/reviews').set(bearer(student.token)).send({ courseId: courseA, rating: 4 }).expect(201)

    const four = await api().get(`/courses?instructorId=${instructor.id}&rating=4`).expect(200)
    expect(four.body.data.map((c: { id: number }) => c.id)).toEqual([courseA])
    // Khóa chưa có đánh giá không thuộc mức sao nào
    const five = await api().get(`/courses?instructorId=${instructor.id}&rating=5`).expect(200)
    expect(five.body.totalItems).toBe(0)
  })

  it('giá trị sai → 422', async () => {
    await api().get('/courses?categoryId=abc').expect(422)
    await api().get('/courses?rating=6').expect(422)
  })

  it('GET /courses/filters trả lựa chọn + số khóa', async () => {
    const res = await api().get('/courses/filters').expect(200)
    const { categories, instructors, price, ratings, levels } = res.body.data
    expect(categories.find((c: { id: number }) => c.id === categoryA)).toMatchObject({ count: 1 })
    expect(instructors.find((u: { id: number }) => u.id === instructor.id)).toMatchObject({ count: 2 })
    expect(price.all).toBe(price.free + price.paid)
    expect(ratings.map((r: { stars: number }) => r.stars)).toEqual([5, 4, 3, 2, 1])
    expect(levels).toHaveLength(4)
  })
})

describe('Chi tiết khóa học', () => {
  it('có số khóa + số học viên của giảng viên', async () => {
    const res = await api().get(`/courses/${courseA}`).expect(200)
    expect(res.body.data.instructor).toMatchObject({ id: instructor.id, courseCount: 2, studentCount: 1 })
  })
})

describe('Bình luận khóa học', () => {
  it('khách phải nhập tên + email', async () => {
    const res = await api().post(`/courses/${courseA}/comments`).send({ content: 'Hay quá' }).expect(422)
    expect(res.body.errors.map((e: { field: string }) => e.field)).toEqual(['name', 'email'])
  })

  it('khách gửi được, danh sách KHÔNG lộ email', async () => {
    await api()
      .post(`/courses/${courseA}/comments`)
      .send({ name: 'Khách', email: 'khach@test.local', content: 'Khóa học rất dễ hiểu' })
      .expect(201)
    const res = await api().get(`/courses/${courseA}/comments`).expect(200)
    expect(res.body.totalItems).toBe(1)
    expect(res.body.data[0]).toMatchObject({ name: 'Khách', content: 'Khóa học rất dễ hiểu', user: null })
    expect(res.body.data[0].email).toBeUndefined()
  })

  it('đang đăng nhập: tên lấy từ tài khoản, bỏ qua tên gửi lên', async () => {
    const student = await registerStudent()
    const res = await api()
      .post(`/courses/${courseB}/comments`)
      .set(bearer(student.token))
      .send({ name: 'Tên giả', content: 'Bình luận của học viên' })
      .expect(201)
    expect(res.body.data.name).not.toBe('Tên giả')
    expect(res.body.data.user.id).toBe(student.id)
  })

  it('khóa không tồn tại → 404', async () => {
    await api().get('/courses/999999/comments').expect(404)
  })
})

describe('Liên hệ', () => {
  it('lưu tin nhắn và báo admin qua email (nội dung được escape)', async () => {
    const email = uniqueEmail('contact')
    await api()
      .post('/contact')
      .send({ name: 'Người lạ', email, message: '<script>alert(1)</script>' })
      .expect(201)
    const sent = lastEmailTo(process.env.ADMIN_EMAIL!)
    expect(sent?.subject).toContain('Người lạ')
    expect(sent?.html).toContain('&lt;script&gt;')
    expect(sent?.html).not.toContain('<script>')
  })

  it('thiếu dữ liệu → 422', async () => {
    await api().post('/contact').send({ name: '', email: 'x', message: '' }).expect(422)
  })
})
