import request from 'supertest'
import app from '../src/app'

// Gọi API trực tiếp trên app Express (không cần bật server, không chiếm cổng)
export const api = () => request(app)

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` })

let counter = 0
export const uniqueEmail = (prefix = 'user') => `${prefix}-${Date.now()}-${counter++}@test.local`
export const uniqueName = (prefix = 'item') => `${prefix} ${Date.now()}-${counter++}`

export const PASSWORD = 'Password@123'

export type Account = { id: number; email: string; token: string; refreshToken: string }

export const login = async (email: string, password = PASSWORD): Promise<Account> => {
  const res = await api().post('/auth/login').send({ email, password }).expect(200)
  const { accessToken, refreshToken, account } = res.body.data
  return { id: account.id, email, token: accessToken, refreshToken }
}

export const loginAdmin = () => login(process.env.ADMIN_EMAIL!, process.env.ADMIN_PASSWORD!)

// Đăng ký học viên mới (register trả token luôn)
export const registerStudent = async (prefix = 'student'): Promise<Account> => {
  const email = uniqueEmail(prefix)
  const res = await api()
    .post('/auth/register')
    .send({ email, password: PASSWORD, confirmPassword: PASSWORD, name: 'Test User', phoneNumber: '0900000000' })
    .expect(201)
  const { accessToken, refreshToken, account } = res.body.data
  return { id: account.id, email, token: accessToken, refreshToken }
}

// Giảng viên = đăng ký rồi admin đổi role qua API. Đăng nhập lại để token mang role mới
export const createInstructor = async (admin: Account) => {
  const user = await registerStudent('instructor')
  const roles = await api().get('/roles?limit=100').set(bearer(admin.token)).expect(200)
  const instructorRole = roles.body.data.find((r: { name: string }) => r.name === 'INSTRUCTOR')
  await api().put(`/users/${user.id}/role`).set(bearer(admin.token)).send({ roleId: instructorRole.id }).expect(200)
  return login(user.email)
}

export const createCategory = async (admin: Account) => {
  const res = await api()
    .post('/categories')
    .set(bearer(admin.token))
    .send({ name: uniqueName('Category') })
    .expect(201)
  return res.body.data.id as number
}

// Khóa học đã xuất bản: 1 chương, 2 bài (bài 1 xem thử), giảng viên gửi duyệt, admin duyệt
export const createPublishedCourse = async (
  instructor: Account,
  admin: Account,
  { price = 0, categoryId }: { price?: number; categoryId?: number } = {},
) => {
  const category = categoryId ?? (await createCategory(admin))
  const course = await api()
    .post('/courses')
    .set(bearer(instructor.token))
    .send({ title: uniqueName('Course'), price, categoryId: category })
    .expect(201)
  const courseId = course.body.data.id as number

  const section = await api().post('/sections').set(bearer(instructor.token)).send({ courseId, title: 'Chương 1' }).expect(201)
  const sectionId = section.body.data.id as number

  const preview = await api()
    .post('/lectures')
    .set(bearer(instructor.token))
    .send({ sectionId, title: 'Bài xem thử', videoUrl: 'https://v.test/preview.mp4', durationSec: 120, isPreview: true })
    .expect(201)
  const locked = await api()
    .post('/lectures')
    .set(bearer(instructor.token))
    .send({ sectionId, title: 'Bài thường', videoUrl: 'https://v.test/locked.mp4', durationSec: 300 })
    .expect(201)

  await api().post(`/courses/${courseId}/submit`).set(bearer(instructor.token)).expect(200)
  await api().post(`/courses/${courseId}/approve`).set(bearer(admin.token)).expect(200)

  return {
    courseId,
    sectionId,
    previewLectureId: preview.body.data.id as number,
    lockedLectureId: locked.body.data.id as number,
  }
}

// Email cuối cùng gửi tới 1 địa chỉ (từ hàng đợi email giả lập trong tests/setup.ts)
export const lastEmailTo = (to: string) => globalThis.sentEmails.filter((e) => e.to === to).at(-1)
