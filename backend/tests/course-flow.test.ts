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
  uniqueName,
  watchLecture,
} from './helpers'

let admin: Account
let instructor: Account
let otherInstructor: Account
let categoryId: number

beforeAll(async () => {
  admin = await loginAdmin()
  instructor = await createInstructor(admin)
  otherInstructor = await createInstructor(admin)
  categoryId = await createCategory(admin)
})

describe('Giảng viên soạn khóa học và luồng duyệt', () => {
  it('tạo → soạn mục lục → gửi duyệt → admin duyệt → công khai', async () => {
    const course = await api()
      .post('/courses')
      .set(bearer(instructor.token))
      .send({ title: uniqueName('React'), price: 0, categoryId })
      .expect(201)
    const courseId = course.body.data.id
    expect(course.body.data.status).toBe('DRAFT')

    // Khóa rỗng không gửi duyệt được
    await api().post(`/courses/${courseId}/submit`).set(bearer(instructor.token)).expect(409)

    const section = await api()
      .post('/sections')
      .set(bearer(instructor.token))
      .send({ courseId, title: 'A' })
      .expect(201)
    await api()
      .post('/lectures')
      .set(bearer(instructor.token))
      .send({ sectionId: section.body.data.id, title: 'Bài 1' })
      .expect(201)

    // Giảng viên khác không đụng được vào khóa này
    await api().post('/sections').set(bearer(otherInstructor.token)).send({ courseId, title: 'X' }).expect(403)
    await api().post(`/courses/${courseId}/submit`).set(bearer(otherInstructor.token)).expect(403)

    await api().post(`/courses/${courseId}/submit`).set(bearer(instructor.token)).expect(200)
    // Đang chờ duyệt thì không sửa được, giảng viên cũng không tự duyệt được
    await api()
      .put(`/courses/${courseId}`)
      .set(bearer(instructor.token))
      .send({ title: 'Sửa', price: 0, categoryId })
      .expect(409)
    await api().post(`/courses/${courseId}/approve`).set(bearer(instructor.token)).expect(403)

    // Chưa duyệt thì trang công khai không thấy
    await api().get(`/courses/${courseId}`).expect(404)

    await api().post(`/courses/${courseId}/approve`).set(bearer(admin.token)).expect(200)
    expect(lastEmailTo(instructor.email)?.subject).toContain('đã được duyệt')
    await api().get(`/courses/${courseId}`).expect(200)
  })

  it('từ chối kèm lý do → giảng viên sửa → gửi lại', async () => {
    const course = await api()
      .post('/courses')
      .set(bearer(instructor.token))
      .send({ title: uniqueName('Node'), price: 0, categoryId })
      .expect(201)
    const courseId = course.body.data.id
    const section = await api()
      .post('/sections')
      .set(bearer(instructor.token))
      .send({ courseId, title: 'A' })
      .expect(201)
    await api()
      .post('/lectures')
      .set(bearer(instructor.token))
      .send({ sectionId: section.body.data.id, title: 'L' })
      .expect(201)
    await api().post(`/courses/${courseId}/submit`).set(bearer(instructor.token)).expect(200)

    await api().post(`/courses/${courseId}/reject`).set(bearer(admin.token)).send({ reason: 'Thiếu mô tả' }).expect(200)
    const mine = await api().get(`/courses/mine/${courseId}`).set(bearer(instructor.token)).expect(200)
    expect(mine.body.data).toMatchObject({ status: 'REJECTED', rejectReason: 'Thiếu mô tả' })

    await api()
      .put(`/courses/${courseId}`)
      .set(bearer(instructor.token))
      .send({ title: uniqueName('Node đầy đủ'), description: 'Mô tả chi tiết', price: 0, categoryId })
      .expect(200)
    await api().post(`/courses/${courseId}/submit`).set(bearer(instructor.token)).expect(200)
  })

  it('2 admin duyệt cùng lúc → chỉ 1 lần thành công', async () => {
    const course = await api()
      .post('/courses')
      .set(bearer(instructor.token))
      .send({ title: uniqueName('Race'), price: 0, categoryId })
      .expect(201)
    const courseId = course.body.data.id
    const section = await api()
      .post('/sections')
      .set(bearer(instructor.token))
      .send({ courseId, title: 'A' })
      .expect(201)
    await api()
      .post('/lectures')
      .set(bearer(instructor.token))
      .send({ sectionId: section.body.data.id, title: 'L' })
      .expect(201)
    await api().post(`/courses/${courseId}/submit`).set(bearer(instructor.token)).expect(200)

    const results = await Promise.all([
      api().post(`/courses/${courseId}/approve`).set(bearer(admin.token)),
      api().post(`/courses/${courseId}/approve`).set(bearer(admin.token)),
    ])
    expect(results.map((r) => r.status).sort()).toEqual([200, 409])
  })

  it('đổi thứ tự chương và chuyển bài sang chương khác', async () => {
    const course = await api()
      .post('/courses')
      .set(bearer(instructor.token))
      .send({ title: uniqueName('Order'), price: 0, categoryId })
      .expect(201)
    const courseId = course.body.data.id
    const a = (await api().post('/sections').set(bearer(instructor.token)).send({ courseId, title: 'A' })).body.data.id
    const b = (await api().post('/sections').set(bearer(instructor.token)).send({ courseId, title: 'B' })).body.data.id
    const lecture = (await api().post('/lectures').set(bearer(instructor.token)).send({ sectionId: a, title: 'L' }))
      .body.data.id

    const reordered = await api()
      .put('/sections/reorder')
      .set(bearer(instructor.token))
      .send({ courseId, sectionIds: [b, a] })
      .expect(200)
    expect(reordered.body.data.map((s: { id: number }) => s.id)).toEqual([b, a])
    // Thiếu id → 422
    await api()
      .put('/sections/reorder')
      .set(bearer(instructor.token))
      .send({ courseId, sectionIds: [b] })
      .expect(422)

    const moved = await api()
      .put(`/lectures/${lecture}`)
      .set(bearer(instructor.token))
      .send({ title: 'L', sectionId: b })
      .expect(200)
    expect(moved.body.data.sectionId).toBe(b)
  })
})

describe('Học viên: tìm, ghi danh, học, đánh giá', () => {
  it('luồng đầy đủ trên khóa miễn phí', async () => {
    const { courseId, previewLectureId, lockedLectureId } = await createPublishedCourse(instructor, admin, {
      categoryId,
    })
    const student = await registerStudent()

    // Trang chi tiết: ẩn link video bài không xem thử, khách thì isEnrolled = null
    const guest = await api().get(`/courses/${courseId}`).expect(200)
    const lectures = guest.body.data.sections[0].lectures
    expect(lectures.find((l: { id: number }) => l.id === previewLectureId).videoUrl).toBeTruthy()
    expect(lectures.find((l: { id: number }) => l.id === lockedLectureId).videoUrl).toBeNull()
    expect(guest.body.data.isEnrolled).toBeNull()

    // Chưa ghi danh: xem được bài xem thử, không xem được bài thường
    await api().get(`/lectures/${previewLectureId}`).set(bearer(student.token)).expect(200)
    await api().get(`/lectures/${lockedLectureId}`).set(bearer(student.token)).expect(403)

    await api().post('/enrollments').set(bearer(student.token)).send({ courseId }).expect(201)
    await api().post('/enrollments').set(bearer(student.token)).send({ courseId }).expect(409)
    await api().get(`/lectures/${lockedLectureId}`).set(bearer(student.token)).expect(200)
    const detail = await api().get(`/courses/${courseId}`).set(bearer(student.token)).expect(200)
    expect(detail.body.data.isEnrolled).toBe(true)

    // Tiến độ: 1/2 bài = 50%. Bài có video phải xem đủ 90% mới đánh dấu được
    await api().post(`/lectures/${previewLectureId}/complete`).set(bearer(student.token)).expect(409)
    await watchLecture(student.token, previewLectureId, 120)
    await api().post(`/lectures/${previewLectureId}/complete`).set(bearer(student.token)).expect(200)
    await api().post(`/lectures/${previewLectureId}/complete`).set(bearer(student.token)).expect(200) // gọi lại không sao
    const learning = await api().get(`/enrollments/mine/${courseId}`).set(bearer(student.token)).expect(200)
    expect(learning.body.data.progress).toEqual({ totalLectures: 2, completedLectures: 1, percent: 50 })

    // Giảng viên thấy học viên và tiến độ
    const students = await api().get(`/courses/mine/${courseId}/students`).set(bearer(instructor.token)).expect(200)
    expect(students.body.data[0].progress.percent).toBe(50)

    // Đánh giá: phải ghi danh, mỗi người 1 lần
    const outsider = await registerStudent()
    await api().post('/reviews').set(bearer(outsider.token)).send({ courseId, rating: 5 }).expect(403)
    await api().post('/reviews').set(bearer(student.token)).send({ courseId, rating: 4, comment: 'Hay' }).expect(201)
    await api().post('/reviews').set(bearer(student.token)).send({ courseId, rating: 5 }).expect(409)
    const reviews = await api().get(`/reviews?courseId=${courseId}`).expect(200)
    expect(reviews.body.summary).toMatchObject({ averageRating: 4, totalReviews: 1 })
  })

  it('khóa có phí → 402; giảng viên không tự ghi danh khóa mình', async () => {
    const { courseId } = await createPublishedCourse(instructor, admin, { categoryId, price: 199000 })
    const student = await registerStudent()
    await api().post('/enrollments').set(bearer(student.token)).send({ courseId }).expect(402)

    const { courseId: freeId } = await createPublishedCourse(instructor, admin, { categoryId })
    await api().post('/enrollments').set(bearer(instructor.token)).send({ courseId: freeId }).expect(409)
  })

  it('danh sách công khai: lọc theo danh mục, miễn phí / có phí', async () => {
    const category = await createCategory(admin)
    await createPublishedCourse(instructor, admin, { categoryId: category, price: 0 })
    await createPublishedCourse(instructor, admin, { categoryId: category, price: 99000 })

    const all = await api().get(`/courses?categoryId=${category}`).expect(200)
    expect(all.body.totalItems).toBe(2)
    const free = await api().get(`/courses?categoryId=${category}&price=free`).expect(200)
    expect(free.body.data.map((c: { price: number }) => c.price)).toEqual([0])
    const paid = await api().get(`/courses?categoryId=${category}&price=paid&sort=price_desc`).expect(200)
    expect(paid.body.data[0].price).toBe(99000)
  })

  it('khóa đã xuất bản: sửa được, không xóa được bài cuối; admin gỡ → mất khỏi trang công khai', async () => {
    const { courseId, previewLectureId, lockedLectureId } = await createPublishedCourse(instructor, admin, {
      categoryId,
    })

    await api()
      .put(`/courses/${courseId}`)
      .set(bearer(instructor.token))
      .send({ title: uniqueName('Đã sửa'), price: 0, categoryId })
      .expect(200)
    await api().delete(`/courses/${courseId}`).set(bearer(instructor.token)).expect(409)
    await api().delete(`/lectures/${lockedLectureId}`).set(bearer(instructor.token)).expect(200)
    await api().delete(`/lectures/${previewLectureId}`).set(bearer(instructor.token)).expect(409)

    await api().post(`/courses/${courseId}/unpublish`).set(bearer(admin.token)).send({ reason: 'Vi phạm' }).expect(200)
    await api().get(`/courses/${courseId}`).expect(404)
    expect(lastEmailTo(instructor.email)?.subject).toContain('gỡ')
  })
})
