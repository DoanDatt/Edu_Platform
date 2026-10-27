import { NotificationType } from '@/constants/type'
import z from 'zod'
import { PaginationQuery, PaginationRes } from './common.schema'

export const NotificationSchema = z.object({
  id: z.number(),
  type: z.enum(NotificationType),
  title: z.string(),
  message: z.string(),
  link: z.string().nullable(), // trang frontend mở khi bấm vào
  readAt: z.string().nullable(), // null = chưa đọc
  createdAt: z.string()
})
// Tên NotificationItemType (không phải NotificationType): tránh trùng hằng NotificationType trong constants
export type NotificationItemType = z.infer<typeof NotificationSchema>

export const GetNotificationsQuery = PaginationQuery
export type GetNotificationsQueryType = z.infer<typeof GetNotificationsQuery>

// GET /notifications: ngoài phân trang còn có unreadCount
export const NotificationListRes = PaginationRes.extend({
  data: z.array(NotificationSchema),
  unreadCount: z.number(),
  message: z.string()
})
export type NotificationListResType = z.infer<typeof NotificationListRes>

// GET /notifications/unread-count
export const UnreadCountRes = z.object({
  data: z.object({ unreadCount: z.number() }),
  message: z.string()
})
export type UnreadCountResType = z.infer<typeof UnreadCountRes>

// PATCH /notifications/:id/read → thông báo vừa đánh dấu
export const NotificationRes = z.object({
  data: NotificationSchema,
  message: z.string()
})
export type NotificationResType = z.infer<typeof NotificationRes>

// PATCH /notifications/read-all → số thông báo vừa được đánh dấu
export const MarkAllReadRes = z.object({
  data: z.object({ count: z.number() }),
  message: z.string()
})
export type MarkAllReadResType = z.infer<typeof MarkAllReadRes>
