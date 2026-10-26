import { Request, Response } from 'express'
import * as notificationService from './notification.service'
import { GetNotificationsQueryType, NotificationParamsType } from './notification.schema'

export const getNotifications = async (req: Request, res: Response) => {
  const query = req.query as unknown as GetNotificationsQueryType
  const result = await notificationService.getNotifications(req.user!.userId, query)
  res.json({ message: 'Lấy thông báo thành công', ...result })
}

export const getUnreadCount = async (req: Request, res: Response) => {
  const unreadCount = await notificationService.getUnreadCount(req.user!.userId)
  res.json({ message: 'Lấy số thông báo chưa đọc thành công', data: { unreadCount } })
}

export const markAsRead = async (req: Request, res: Response) => {
  const { notificationId } = req.params as unknown as NotificationParamsType
  const notification = await notificationService.markAsRead(notificationId, req.user!.userId)
  res.json({ message: 'Đã đánh dấu đã đọc', data: notification })
}

export const markAllAsRead = async (req: Request, res: Response) => {
  const result = await notificationService.markAllAsRead(req.user!.userId)
  res.json({ message: 'Đã đánh dấu tất cả là đã đọc', data: result })
}
