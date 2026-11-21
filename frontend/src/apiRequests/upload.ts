import http, { HttpError } from '@/lib/http'
import { UploadedVideo, UploadResType, VideoUploadSignatureResType } from '@/schemaValidations/upload.schema'

// Upload file: gửi FormData (multipart/form-data), KHÔNG phải JSON.
// http.ts thấy body là FormData thì KHÔNG đặt Content-Type: application/json,
// để trình duyệt tự đặt multipart kèm "boundary" (ranh giới giữa các phần của body)

// Gửi file THẲNG lên Cloudinary bằng XMLHttpRequest: fetch không báo được % đã gửi, xhr.upload.onprogress thì có.
// Không gửi header Authorization (đây là server Cloudinary, không phải backend của mình): chữ ký nằm trong fields
const uploadToCloudinary = (
  file: File,
  uploadUrl: string,
  fields: Record<string, string | number | boolean>,
  onProgress?: (percent: number) => void
) =>
  new Promise<UploadedVideo>((resolve, reject) => {
    const formData = new FormData()
    // Gửi y nguyên các field đã ký: sửa / thiếu field nào là Cloudinary trả 401
    Object.entries(fields).forEach(([key, value]) => formData.append(key, String(value)))
    formData.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', uploadUrl)
    xhr.responseType = 'json'
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      const body = xhr.response as { secure_url?: string; duration?: number; error?: { message?: string } } | null
      if (xhr.status >= 200 && xhr.status < 300 && body?.secure_url) {
        resolve({
          url: body.secure_url,
          durationSec: typeof body.duration === 'number' ? Math.round(body.duration) : undefined
        })
        return
      }
      // Ném HttpError có payload.message → handleErrorApi hiện lỗi giống các API khác
      console.error('Upload Cloudinary lỗi:', body?.error?.message)
      reject(
        new HttpError({
          status: xhr.status,
          payload: { message: 'Không tải được video lên kho lưu trữ, vui lòng thử lại' }
        })
      )
    }
    xhr.onerror = () =>
      reject(new HttpError({ status: 0, payload: { message: 'Mất kết nối khi tải video lên, vui lòng thử lại' } }))
    xhr.send(formData)
  })

const uploadApiRequest = {
  // Backend đọc file ở field tên "file" (multer .single('file'))
  image: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return http.post<UploadResType>('/uploads/image', formData)
  },
  // Upload qua server của mình (máy local không có Cloudinary). Không có % tiến trình
  videoViaServer: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return http.post<UploadResType>('/uploads/video', formData)
  },
  // Xin chữ ký upload (hết hạn sau 1 giờ → xin ngay trước mỗi lần upload, không lưu lại)
  videoSignature: () => http.post<VideoUploadSignatureResType>('/uploads/video/signature', null),
  // Upload video: xin chữ ký trước, backend bảo đi đường nào thì đi đường đó
  video: async ({ file, onProgress }: { file: File; onProgress?: (percent: number) => void }): Promise<UploadedVideo> => {
    const { data } = (await uploadApiRequest.videoSignature()).payload
    if (file.size > data.maxBytes) {
      throw new HttpError({
        status: 413,
        payload: { message: `Video tối đa ${Math.round(data.maxBytes / 1024 / 1024)} MB` }
      })
    }
    if (data.mode === 'cloudinary') return uploadToCloudinary(file, data.uploadUrl, data.fields, onProgress)
    const { url, durationSec } = (await uploadApiRequest.videoViaServer(file)).payload.data
    return { url, durationSec }
  }
}

export default uploadApiRequest
