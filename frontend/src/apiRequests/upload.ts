import http from '@/lib/http'
import { UploadResType } from '@/schemaValidations/upload.schema'

// Upload file: gửi FormData (multipart/form-data), KHÔNG phải JSON.
// http.ts thấy body là FormData thì KHÔNG đặt Content-Type: application/json,
// để trình duyệt tự đặt multipart kèm "boundary" (ranh giới giữa các phần của body)
const uploadApiRequest = {
  // Backend đọc file ở field tên "file" (multer .single('file'))
  image: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return http.post<UploadResType>('/uploads/image', formData)
  },
  // Giống image, khác đường dẫn. Có Cloudinary thì data có thêm durationSec (thời lượng video, giây)
  video: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return http.post<UploadResType>('/uploads/video', formData)
  }
}

export default uploadApiRequest
