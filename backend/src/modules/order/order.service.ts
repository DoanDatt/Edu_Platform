import { randomInt } from 'crypto'
import envConfig from '../../config/env'
import { Prisma } from '../../generated/prisma/client'
import { CourseStatus, NotificationType, OrderStatus, PaymentMethod } from '../../generated/prisma/enums'
import prisma from '../../lib/prisma'
import { HttpError } from '../../utils/error'
import { isEnrolled } from '../enrollment/enrollment.service'
import { notifySafely } from '../notification/notification.service'
import { CreateOrderBodyType, GetMyOrdersQueryType } from './order.schema'

// Đơn chờ thanh toán quá lâu thì job dọn dẹp hằng ngày tự hủy
export const PENDING_ORDER_TTL_MS = 24 * 60 * 60 * 1000

// Bỏ các ký tự dễ đọc nhầm (0/O, 1/I) vì người dùng có thể phải GÕ mã vào nội dung chuyển khoản
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 8

// EDU + 8 ký tự ngẫu nhiên (randomInt của crypto, không đoán được) → 32^8 ≈ 1.1 nghìn tỉ khả năng
const generateOrderCode = () =>
  envConfig.PAYMENT_CODE_PREFIX +
  Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('')

// Định dạng tiền cho câu thông báo: 299000 → "299.000 đ"
const formatVnd = (amount: number) => `${amount.toLocaleString('vi-VN')} đ`

// Dữ liệu 1 đơn trả cho frontend (trang thanh toán, lịch sử mua hàng)
const orderSelect = {
  id: true,
  code: true,
  amount: true,
  status: true,
  method: true,
  paidAt: true,
  createdAt: true,
  course: {
    select: { id: true, title: true, thumbnail: true, category: { select: { id: true, name: true } } },
  },
} satisfies Prisma.OrderSelect

// ===== Người mua =====

export const createOrder = async (userId: number, { courseId }: CreateOrderBodyType) => {
  const course = await prisma.course.findFirst({
    where: { id: courseId, status: CourseStatus.PUBLISHED, deletedAt: null },
    select: { id: true, price: true, instructorId: true },
  })
  if (!course) {
    throw new HttpError(404, 'Không tìm thấy khóa học')
  }
  if (course.instructorId === userId) {
    throw new HttpError(409, 'Bạn là giảng viên của khóa học này')
  }
  if (course.price === 0) {
    throw new HttpError(409, 'Khóa học miễn phí, hãy ghi danh trực tiếp')
  }
  if (await isEnrolled(userId, courseId)) {
    throw new HttpError(409, 'Bạn đã sở hữu khóa học này')
  }

  // Bấm "Mua" nhiều lần → dùng lại đơn đang chờ, không tạo đơn trùng.
  // Giá khóa đã đổi kể từ lúc tạo đơn cũ → hủy đơn cũ, tạo đơn mới đúng giá hiện tại
  const pending = await prisma.order.findFirst({
    where: { userId, courseId, status: OrderStatus.PENDING },
    orderBy: { createdAt: 'desc' },
  })
  if (pending && pending.amount === course.price) {
    return prisma.order.findUniqueOrThrow({ where: { id: pending.id }, select: orderSelect })
  }
  if (pending) {
    await prisma.order.update({ where: { id: pending.id }, data: { status: OrderStatus.CANCELLED } })
  }

  // Mã đơn trùng (gần như không xảy ra) → DB chặn bằng unique (P2002) → sinh mã khác, thử tối đa 3 lần
  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.order.create({
        data: { code: generateOrderCode(), userId, courseId, amount: course.price },
        select: orderSelect,
      })
    } catch (error) {
      const isCodeCollision = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
      if (!isCodeCollision || attempt >= 3) throw error
    }
  }
}

export const getMyOrders = async (userId: number, { page, limit, status }: GetMyOrdersQueryType) => {
  const where = { userId, status }
  const [totalItems, data] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: orderSelect,
    }),
  ])
  return { data, totalItems, page, limit, totalPages: Math.ceil(totalItems / limit) }
}

// Đơn của người khác: báo 404 như không tồn tại (không cho biết id đó có tồn tại hay không)
export const getOwnOrder = async (orderId: number, userId: number) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { course: { select: { title: true } } },
  })
  if (!order || order.userId !== userId) {
    throw new HttpError(404, 'Không tìm thấy đơn hàng')
  }
  return order
}

export const getMyOrder = async (orderId: number, userId: number) => {
  await getOwnOrder(orderId, userId)
  return prisma.order.findUniqueOrThrow({ where: { id: orderId }, select: orderSelect })
}

export const cancelOrder = async (orderId: number, userId: number) => {
  const order = await getOwnOrder(orderId, userId)
  if (order.status !== OrderStatus.PENDING) {
    throw new HttpError(409, 'Chỉ hủy được đơn đang chờ thanh toán')
  }
  return prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.CANCELLED },
    select: orderSelect,
  })
}

// ===== Xác nhận đã thanh toán (các cổng MoMo / PayPal / SePay gọi sau khi kiểm tra chữ ký) =====

type MarkPaidInput = {
  orderId: number
  method: PaymentMethod
  providerRef: string // mã giao dịch phía cổng
  paidAmount: number // số tiền cổng báo đã nhận (VND)
}

// Đánh dấu đơn đã thanh toán + ghi danh khóa học, trong 1 transaction: cùng thành công hoặc cùng thất bại.
// Gọi nhiều lần cho cùng 1 đơn (cổng gửi lại) vẫn an toàn: lần sau trả alreadyPaid, không ghi danh / báo lại
export const markOrderPaid = async ({ orderId, method, providerRef, paidAmount }: MarkPaidInput) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true } },
      course: { select: { title: true, instructorId: true } },
    },
  })
  if (!order) {
    throw new HttpError(404, 'Không tìm thấy đơn hàng')
  }
  if (order.status === OrderStatus.PAID) {
    return { alreadyPaid: true }
  }
  // Trả THIẾU tiền → không xác nhận (chuyển khoản tay có thể gõ sai số tiền). Trả dư vẫn nhận
  if (paidAmount < order.amount) {
    throw new HttpError(409, `Số tiền thanh toán (${formatVnd(paidAmount)}) nhỏ hơn giá trị đơn hàng`)
  }

  const updated = await prisma.$transaction(async (tx) => {
    // updateMany + điều kiện status: 2 lần báo về đến CÙNG LÚC thì chỉ 1 lần đổi được (count = 1).
    // Nhận cả đơn đã hủy: người mua chuyển khoản muộn sau khi đơn bị hủy thì tiền đã nhận → vẫn phải giao khóa
    const { count } = await tx.order.updateMany({
      where: { id: orderId, status: { not: OrderStatus.PAID } },
      data: { status: OrderStatus.PAID, method, providerRef, paidAt: new Date() },
    })
    if (count === 0) return false
    // skipDuplicates: đã ghi danh từ trước (hiếm) thì bỏ qua, không lỗi
    await tx.enrollment.createMany({
      data: [{ userId: order.userId, courseId: order.courseId }],
      skipDuplicates: true,
    })
    return true
  })
  if (!updated) {
    return { alreadyPaid: true }
  }

  await notifySafely({
    userId: order.course.instructorId,
    type: NotificationType.NEW_ORDER,
    title: 'Có đơn hàng mới',
    message: `${order.user.name} đã mua khóa "${order.course.title}" (${formatVnd(order.amount)}).`,
    link: `/instructor/courses/${order.courseId}/students`,
  })
  return { alreadyPaid: false }
}

// Job dọn dẹp hằng ngày: hủy đơn chờ thanh toán quá PENDING_ORDER_TTL_MS
export const cancelExpiredOrders = async () => {
  const { count } = await prisma.order.updateMany({
    where: { status: OrderStatus.PENDING, createdAt: { lt: new Date(Date.now() - PENDING_ORDER_TTL_MS) } },
    data: { status: OrderStatus.CANCELLED },
  })
  return count
}
