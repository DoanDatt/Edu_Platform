import z from 'zod'
import { PaginationQuerySchema } from '../../utils/pagination'

export const NotificationParamsSchema = z
  .object({
    notificationId: z.coerce.number().int().positive(),
  })
  .strict()

export type NotificationParamsType = z.infer<typeof NotificationParamsSchema>

// ?page=1&limit=10 → thông báo của chính mình, mới nhất trước
export const GetNotificationsQuerySchema = PaginationQuerySchema

export type GetNotificationsQueryType = z.infer<typeof GetNotificationsQuerySchema>
