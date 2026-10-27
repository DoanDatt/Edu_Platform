import http from '@/lib/http'
import { toQueryString } from '@/lib/utils'
import {
  GetNotificationsQueryType,
  MarkAllReadResType,
  NotificationListResType,
  NotificationResType,
  UnreadCountResType
} from '@/schemaValidations/notification.schema'

const prefix = '/notifications'

export const notificationApiRequest = {
  list: (query?: Partial<GetNotificationsQueryType>) =>
    http.get<NotificationListResType>(`${prefix}${toQueryString(query)}`),
  unreadCount: () => http.get<UnreadCountResType>(`${prefix}/unread-count`),
  // Không có body: chỉ cần id trên đường dẫn → gửi null
  markAsRead: (id: number) => http.patch<NotificationResType>(`${prefix}/${id}/read`, null),
  markAllAsRead: () => http.patch<MarkAllReadResType>(`${prefix}/read-all`, null)
}

export default notificationApiRequest
