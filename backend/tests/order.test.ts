import { beforeAll, describe, expect, it } from 'vitest'
import { PaymentMethod } from '../src/generated/prisma/enums'
import { markOrderPaid } from '../src/modules/order/order.service'
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

let admin: Account
let instructor: Account
let student: Account
let paidCourseId: number
let freeCourseId: number

beforeAll(async () => {
  admin = await loginAdmin()
  instructor = await createInstructor(admin)
  student = await registerStudent()
  const categoryId = await createCategory(admin)
  paidCourseId = (await createPublishedCourse(instructor, admin, { price: 199_000, categoryId })).courseId
  freeCourseId = (await createPublishedCourse(instructor, admin, { price: 0, categoryId })).courseId
})

describe('Đơn hàng', () => {
  it('chưa đăng nhập thì không mua được', async () => {
    await api().post('/orders').send({ courseId: paidCourseId }).expect(401)
  })

  it('không tạo đơn cho khóa miễn phí, khóa của chính mình, khóa không tồn tại', async () => {
    await api().post('/orders').set(bearer(student.token)).send({ courseId: freeCourseId }).expect(409)
    await api().post('/orders').set(bearer(instructor.token)).send({ courseId: paidCourseId }).expect(409)
    await api().post('/orders').set(bearer(student.token)).send({ courseId: 999_999 }).expect(404)
  })

  it('tạo đơn chốt giá, bấm Mua lần 2 dùng lại đơn đang chờ', async () => {
    const first = await api().post('/orders').set(bearer(student.token)).send({ courseId: paidCourseId }).expect(201)
    expect(first.body.data.status).toBe('PENDING')
    expect(first.body.data.amount).toBe(199_000)
    expect(first.body.data.code).toMatch(/^EDU[A-Z2-9]{8}$/)

    const second = await api().post('/orders').set(bearer(student.token)).send({ courseId: paidCourseId }).expect(201)
    expect(second.body.data.id).toBe(first.body.data.id)
  })

  it('chỉ xem / hủy được đơn của chính mình', async () => {
    const other = await registerStudent('other')
    const order = await api().post('/orders').set(bearer(student.token)).send({ courseId: paidCourseId }).expect(201)
    const orderId = order.body.data.id

    await api().get(`/orders/${orderId}`).set(bearer(other.token)).expect(404)
    await api().post(`/orders/${orderId}/cancel`).set(bearer(other.token)).expect(404)

    const mine = await api().get('/orders/mine').set(bearer(student.token)).expect(200)
    expect(mine.body.data.some((o: { id: number }) => o.id === orderId)).toBe(true)
  })

  it('hủy đơn, rồi mua lại tạo đơn mới', async () => {
    const order = await api().post('/orders').set(bearer(student.token)).send({ courseId: paidCourseId }).expect(201)
    const orderId = order.body.data.id
    const cancelled = await api().post(`/orders/${orderId}/cancel`).set(bearer(student.token)).expect(200)
    expect(cancelled.body.data.status).toBe('CANCELLED')
    // Hủy lần 2: đơn không còn chờ thanh toán
    await api().post(`/orders/${orderId}/cancel`).set(bearer(student.token)).expect(409)

    const again = await api().post('/orders').set(bearer(student.token)).send({ courseId: paidCourseId }).expect(201)
    expect(again.body.data.id).not.toBe(orderId)
  })
})

describe('Xác nhận thanh toán', () => {
  it('trả thiếu tiền thì không xác nhận', async () => {
    const order = await api().post('/orders').set(bearer(student.token)).send({ courseId: paidCourseId }).expect(201)
    await expect(
      markOrderPaid({ orderId: order.body.data.id, method: PaymentMethod.SEPAY, providerRef: 'test-1', paidAmount: 1_000 }),
    ).rejects.toMatchObject({ status: 409 })
  })

  it('thanh toán đủ → đơn PAID, tự ghi danh, báo giảng viên; báo lần 2 không xử lý lại', async () => {
    const order = await api().post('/orders').set(bearer(student.token)).send({ courseId: paidCourseId }).expect(201)
    const orderId = order.body.data.id

    const first = await markOrderPaid({ orderId, method: PaymentMethod.MOMO, providerRef: 'momo-1', paidAmount: 199_000 })
    expect(first.alreadyPaid).toBe(false)
    const second = await markOrderPaid({ orderId, method: PaymentMethod.MOMO, providerRef: 'momo-1', paidAmount: 199_000 })
    expect(second.alreadyPaid).toBe(true)

    const paid = await api().get(`/orders/${orderId}`).set(bearer(student.token)).expect(200)
    expect(paid.body.data.status).toBe('PAID')
    expect(paid.body.data.method).toBe('MOMO')

    // Đã ghi danh → vào học được; mua lại khóa này bị chặn
    await api().get(`/enrollments/mine/${paidCourseId}`).set(bearer(student.token)).expect(200)
    await api().post('/orders').set(bearer(student.token)).send({ courseId: paidCourseId }).expect(409)

    const notifications = await api().get('/notifications?limit=1').set(bearer(instructor.token)).expect(200)
    expect(notifications.body.data[0].type).toBe('NEW_ORDER')
  })

  it('doanh thu hiện trên dashboard admin và giảng viên', async () => {
    const adminStats = await api().get('/stats/admin').set(bearer(admin.token)).expect(200)
    expect(adminStats.body.data.revenue.total).toBeGreaterThanOrEqual(199_000)
    expect(adminStats.body.data.revenue.daily).toHaveLength(30)

    const instructorStats = await api().get('/stats/instructor').set(bearer(instructor.token)).expect(200)
    const revenue = instructorStats.body.data.revenue
    expect(revenue.total).toBe(199_000)
    expect(revenue.orders30Days).toBe(1)
    expect(revenue.topCourses[0]).toMatchObject({ id: paidCourseId, orders: 1, revenue: 199_000 })
    // Hôm nay (giờ VN) là phần tử cuối của mảng theo ngày
    expect(revenue.daily.at(-1).revenue).toBe(199_000)
  })
})
