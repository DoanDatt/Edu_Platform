import uploadApiRequest from '@/apiRequests/upload'
import { useMutation } from '@tanstack/react-query'

// Chỉ tải file lên, trả url. Không invalidate gì: lưu url vào hồ sơ / khóa học là việc của bước sau
// (ví dụ useUpdateProfileMutation) → hook này dùng lại được cho avatar, ảnh bìa khóa học...
export const useUploadImageMutation = () => {
  return useMutation({
    mutationFn: uploadApiRequest.image
  })
}

export const useUploadVideoMutation = () => {
  return useMutation({
    mutationFn: uploadApiRequest.video
  })
}
