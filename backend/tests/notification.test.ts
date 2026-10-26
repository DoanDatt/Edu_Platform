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
  uniqueName,
} from './helpers'

let admin: Account
let instructor: Account
let student: Account
let categoryId: number

beforeAll(async () => {
  admin = await loginAdmin()
  instructor = await createInstructor(admin)
  student = await registerStudent()
  categoryId = await createCategory(admin)
})

type NotificationItem = { id: number; type: string; title: string; message: string; link: string | null; readAt: string | null }

// Thông báo mới nhất của 1 người (API trả mới nhất trước)
const latestNotification = async (account: Account): Promise<NotificationItem> => {
  const res = await api().get('/notifications?limit=1').set(bearer(account.token)).expect(200)
  return res.body.data[0]
}

const unreadCount = async (account: Account): Promise<number> => {
  const res = await api().get('/notifications/unread-count').set(bearer(account.token)).expect(200)
  return res.body.data.unreadCount
}

describe('Thông báo trong web', () => {
  it('chưa đăng nhập thì không xem được', async () => {
    await api().get('/notifications').expect(401)
  })

  it('gửi duyệt → admin nhận; từ chối → giảng viên nhận kèm lý do', async () => {
    const course = await api()
      .post('/courses')
      .set(bearer(instructor.token))
      .send({ title: uniqueName('Thông báo'), price: 0, categoryId })
      .expect(201)
    const courseId = course.body.data.id
    const section = await api().post('/sections').set(bearer(instructor.token)).send({ courseId, title: 'A' }).expect(201)
    await api().post('/lectures').set(bearer(instructor.token)).send({ sectionId: section.body.data.id, title: 'L' }).expect(201)

    await api().post(`/courses/${courseId}/submit`).set(bearer(instructor.token)).expect(200)
    const adminNotification = await latestNotification(admin)
    expect(adminNotification.type).toBe('COURSE_SUBMITTED')
    expect(adminNotification.link).toBe(`/admin/courses/${courseId}`)
    expect(adminNotification.readAt).toBeNull()

    await api().post(`/courses/${courseId}/reject`).set(bearer(admin.token)).send({ reason: 'Thiếu mô tả' }).expect(200)
    const instructorNotification = await latestNotification(instructor)
    expect(instructorNotification.type).toBe('COURSE_REJECTED')
    expect(instructorNotification.message).toContain('Thiếu mô tả')
    expect(instructorNotification.link).toBe(`/instructor/courses/${courseId}`)
  })

  it('ghi danh và đánh giá → giảng viên nhận', async () => {
    const { courseId } = await createPublishedCourse(instructor, admin, { categoryId })
    expect((await latestNotification(instructor)).type).toBe('COURSE_APPROVED')

    await api().post('/enrollments').set(bearer(student.token)).send({ courseId }).expect(201)
    expect((await latestNotification(instructor)).type).toBe('NEW_ENROLLMENT')

    await api().post('/reviews').set(bearer(student.token)).send({ courseId, rating: 5, comment: 'Hay' }).expect(201)
    const review = await latestNotification(instructor)
    expect(review.type).toBe('NEW_REVIEW')
    expect(review.link).toBe(`/courses/${courseId}`)
  })

  it('đánh dấu đã đọc 1 thông báo, rồi đọc tất cả', async () => {
    const before = await unreadCount(instructor)
    expect(before).toBeGreaterThan(0)

    const notification = await latestNotification(instructor)
    const read = await api().patch(`/notifications/${notification.id}/read`).set(bearer(instructor.token)).expect(200)
    expect(read.body.data.readAt).not.toBeNull()
    expect(await unreadCount(instructor)).toBe(before - 1)

    // Đọc lại lần nữa: không lỗi, giữ nguyên thời điểm đọc lần đầu
    const again = await api().patch(`/notifications/${notification.id}/read`).set(bearer(instructor.token)).expect(200)
    expect(again.body.data.readAt).toBe(read.body.data.readAt)

    await api().patch('/notifications/read-all').set(bearer(instructor.token)).expect(200)
    expect(await unreadCount(instructor)).toBe(0)
  })

  it('không đọc được thông báo của người khác', async () => {
    const notification = await latestNotification(instructor)
    await api().patch(`/notifications/${notification.id}/read`).set(bearer(student.token)).expect(404)
  })
})
