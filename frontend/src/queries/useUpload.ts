import uploadApiRequest from '@/apiRequests/upload'
import { useMutation } from '@tanstack/react-query'

// Chỉ tải file lên, trả url. Không invalidate gì: lưu url vào hồ sơ / khóa học là việc của bước sau
// (ví dụ useUpdateProfileMutation) → hook này dùng lại được cho avatar, ảnh bìa khóa học...
export const useUploadImageMutation = () => {
  return useMutation({
    mutationFn: uploadApiRequest.image
  })
}

// Video: tự xin chữ ký rồi upload thẳng lên Cloudinary (có %), local không có Cloudinary thì qua server.
// Trả thẳng { url, durationSec } (không bọc trong payload như các API khác)
export const useUploadVideoMutation = () => {
  return useMutation({
    mutationFn: uploadApiRequest.video
  })
}
