import { beforeAll, describe, expect, it } from 'vitest'
import {
  Account,
  api,
  bearer,
  createCategory,
  createInstructor,
  createPublishedCourse,
  loginAdmin,
  registerStudent,
} from './helpers'

// Số liệu thêm cho trang chủ / danh sách khóa học: số bài học, số khóa theo danh mục, đánh giá nổi bật
let admin: Account
let instructor: Account
let categoryId: number
let courseId: number

beforeAll(async () => {
  admin = await loginAdmin()
  instructor = await createInstructor(admin)
  categoryId = await createCategory(admin)
  // Khóa đã xuất bản có 2 bài (helper tạo sẵn 1 chương, 2 bài)
  courseId = (await createPublishedCourse(instructor, admin, { categoryId })).courseId
})

// DB test không bị dọn giữa các lần chạy → danh mục tích lũy quá 100, danh mục vừa tạo có thể nằm ở trang sau
const findCategory = async (id: number) => {
  for (let page = 1; ; page++) {
    const res = await api().get(`/categories?limit=100&page=${page}`).expect(200)
    const category = res.body.data.find((c: { id: number }) => c.id === id)
    if (category || page >= res.body.totalPages) return category
  }
}

describe('Số liệu trang chủ', () => {
  it('danh sách khóa học có totalLectures', async () => {
    const res = await api().get(`/courses?categoryId=${categoryId}`).expect(200)
    expect(res.body.data[0]).toMatchObject({ id: courseId, totalLectures: 2 })
  })

  it('danh mục có courseCount (chỉ đếm khóa đã xuất bản)', async () => {
    // Thêm 1 khóa nháp cùng danh mục → không được tính
    await api()
      .post('/courses')
      .set(bearer(instructor.token))
      .send({ title: 'Khóa nháp', price: 0, categoryId })
      .expect(201)
    const category = await findCategory(categoryId)
    expect(category.courseCount).toBe(1)
    // Khóa trong danh mục chưa có ảnh bìa → chưa có ảnh nền
    expect(category.coverImage).toBeNull()

    // Khóa đã xuất bản có ảnh bìa → ảnh đó thành ảnh nền của danh mục
    const thumbnail = 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
    const detail = await api().get(`/courses/mine/${courseId}`).set(bearer(instructor.token)).expect(200)
    await api()
      .put(`/courses/${courseId}`)
      .set(bearer(instructor.token))
      .send({ title: detail.body.data.title, price: 0, categoryId, thumbnail })
      .expect(200)
    expect((await findCategory(categoryId)).coverImage).toBe(thumbnail)
  })

  it('đánh giá nổi bật: chỉ 4–5 sao, có nhận xét đủ dài, mỗi người 1 đánh giá', async () => {
    const good = await registerStudent('reviewer')
    const short = await registerStudent('reviewer')
    const low = await registerStudent('reviewer')
    for (const student of [good, short, low]) {
      await api().post('/enrollments').set(bearer(student.token)).send({ courseId }).expect(201)
    }
    const write = (student: Account, rating: number, comment: string) =>
      api().post('/reviews').set(bearer(student.token)).send({ courseId, rating, comment }).expect(201)
    await write(good, 5, 'Khóa học rất dễ hiểu, giảng viên nhiệt tình')
    await write(short, 5, 'Hay')
    await write(low, 2, 'Nội dung hơi ít so với mong đợi của mình')

    const res = await api().get('/reviews/featured?limit=12').expect(200)
    const ours = res.body.data.filter((r: { course: { id: number } }) => r.course.id === courseId)
    expect(ours).toHaveLength(1)
    expect(ours[0]).toMatchObject({ rating: 5, user: { id: good.id }, course: { id: courseId } })

    await api().get('/reviews/featured?limit=50').expect(422)
  })
})
