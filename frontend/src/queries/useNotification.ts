import notificationApiRequest from '@/apiRequests/notification'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Chuông hỏi lại server bao lâu một lần (polling). Sau này nâng lên SSE thì server tự đẩy, bỏ được cái này
const POLL_INTERVAL_MS = 30_000

// Số chưa đọc (chấm đỏ trên chuông). API rất nhẹ (chỉ đếm) nên hỏi định kỳ được:
//   refetchInterval: cứ 30 giây gọi lại 1 lần (chỉ khi tab đang mở, tab ẩn thì tạm dừng)
//   refetchOnWindowFocus: quay lại tab là gọi ngay (cài đặt chung của app đang tắt, bật riêng ở đây)
// enabled: chưa đăng nhập thì không gọi (API cần token)
export const useUnreadCountQuery = (enabled: boolean) => {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationApiRequest.unreadCount,
    enabled,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true
  })
}

// 10 thông báo mới nhất. Chỉ tải khi MỞ danh sách (enabled = open): không ai mở thì không tốn request.
// Mỗi lần mở lại đều tải mới (mặc định dữ liệu "cũ" ngay sau khi tải → bật enabled là gọi lại)
export const useNotificationsQuery = (enabled: boolean) => {
  return useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationApiRequest.list({ page: 1, limit: 10 }),
    enabled
  })
}

// Đánh dấu đã đọc → số chưa đọc và danh sách đều đổi → invalidate cả nhánh ['notifications']
export const useMarkNotificationAsReadMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationApiRequest.markAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  })
}

export const useMarkAllNotificationsAsReadMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationApiRequest.markAllAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  })
}
