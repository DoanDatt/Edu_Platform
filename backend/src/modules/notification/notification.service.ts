import { RoleName } from '../../constants/role'
import { NotificationType } from '../../generated/prisma/enums'
import prisma from '../../lib/prisma'
import { HttpError } from '../../utils/error'
import { GetNotificationsQueryType } from './notification.schema'

export type NewNotification = {
  userId: number
  type: NotificationType
  title: string
  message: string
  link?: string // trang frontend mở khi bấm vào, ví dụ /instructor/courses/15
}

// ===== Tạo thông báo (các module khác gọi) =====

// Giống enqueueEmailSafely: thông báo chỉ là phần phụ → lỗi thì ghi log rồi bỏ qua,
// KHÔNG làm hỏng thao tác chính (duyệt khóa, ghi danh... vẫn thành công)
export const notifySafely = async (items: NewNotification | NewNotification[]) => {
  const list = Array.isArray(items) ? items : [items]
  if (list.length === 0) return
  try {
    await prisma.notification.createMany({
      // Cắt cho vừa cột trong DB: message có thể ghép từ tên khóa (300) + lý do từ chối (1000)
      data: list.map((item) => ({ ...item, title: item.title.slice(0, 300), message: item.message.slice(0, 1000) })),
    })
  } catch (error) {
    console.error('Tạo thông báo lỗi:', error)
  }
}

// Gửi cho TẤT CẢ admin (ví dụ: có khóa mới chờ duyệt)
export const notifyAdminsSafely = async (notification: Omit<NewNotification, 'userId'>) => {
  try {
    const admins = await prisma.user.findMany({
      where: { deletedAt: null, role: { name: RoleName.Admin } },
      select: { id: true },
    })
    await notifySafely(admins.map((admin) => ({ ...notification, userId: admin.id })))
  } catch (error) {
    console.error('Tìm admin để gửi thông báo lỗi:', error)
  }
}

// ===== Người dùng xem thông báo của chính mình =====

const notificationSelect = {
  id: true,
  type: true,
  title: true,
  message: true,
  link: true,
  readAt: true,
  createdAt: true,
} as const

export const getNotifications = async (userId: number, { page, limit }: GetNotificationsQueryType) => {
  const where = { userId }
  const [totalItems, data, unreadCount] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      // Cùng thời điểm (tạo hàng loạt) thì id lớn hơn = mới hơn
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: notificationSelect,
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ])
  return { data, unreadCount, totalItems, page, limit, totalPages: Math.ceil(totalItems / limit) }
}

// Chỉ đếm số chưa đọc: API nhẹ để frontend hỏi định kỳ (polling) cho số đỏ trên chuông
export const getUnreadCount = (userId: number) => prisma.notification.count({ where: { userId, readAt: null } })

export const markAsRead = async (notificationId: number, userId: number) => {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } })
  // Thông báo của người khác: báo 404 như không tồn tại (không cho biết id đó có tồn tại hay không)
  if (!notification || notification.userId !== userId) {
    throw new HttpError(404, 'Không tìm thấy thông báo')
  }
  if (notification.readAt) {
    // Đã đọc rồi: giữ nguyên thời điểm đọc lần đầu
    return prisma.notification.findUniqueOrThrow({ where: { id: notificationId }, select: notificationSelect })
  }
  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
    select: notificationSelect,
  })
}

export const markAllAsRead = async (userId: number) => {
  const { count } = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  })
  return { count }
}
