import { Router } from 'express'
import * as notificationController from './notification.controller'
import { requireAuth } from '../../middleware/auth.middleware'
import { validateParams, validateQuery } from '../../middleware/validate.middleware'
import { GetNotificationsQuerySchema, NotificationParamsSchema } from './notification.schema'

// Thông báo của CHÍNH MÌNH: ai đăng nhập cũng dùng được (giống /profile) → chỉ cần requireAuth,
// không cần permission. Service luôn lọc theo req.user nên không xem được thông báo của người khác
const notificationRouter = Router()
notificationRouter.use(requireAuth)

notificationRouter.get('/', validateQuery(GetNotificationsQuerySchema), notificationController.getNotifications)
notificationRouter.get('/unread-count', notificationController.getUnreadCount)
notificationRouter.patch('/read-all', notificationController.markAllAsRead)
notificationRouter.patch(
  '/:notificationId/read',
  validateParams(NotificationParamsSchema),
  notificationController.markAsRead,
)

export default notificationRouter
