import z from 'zod'

// Loại ảnh và dung lượng tối đa: khớp backend (upload.middleware.ts, MAX_IMAGE_MB = 5).
// Kiểm tra ở frontend TRƯỚC khi gửi → báo lỗi ngay, khỏi tốn 1 lần upload file to
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
export const MAX_IMAGE_MB = 5

// POST /uploads/image, /uploads/video: { message, data: { url, ... } }
// Có Cloudinary: url là https://res.cloudinary.com/...; video có thêm durationSec (giây)
export const UploadRes = z.object({
  data: z.object({
    url: z.string(),
    mimeType: z.string(),
    size: z.number(),
    originalName: z.string(),
    durationSec: z.number().optional()
  }),
  message: z.string()
})
export type UploadResType = z.infer<typeof UploadRes>

// Video: khớp backend (VIDEO_TYPES trong upload.middleware.ts).
// Dung lượng: backend mặc định 500 MB, nhưng bản deploy đặt MAX_VIDEO_MB=100 (giới hạn gói Cloudinary miễn phí)
export const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
export const MAX_VIDEO_MB = 100
