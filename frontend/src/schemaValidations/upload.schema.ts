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

// POST /uploads/video/signature: xin cách upload video
// - mode "cloudinary" (deploy): gửi file THẲNG lên Cloudinary tại uploadUrl, kèm y nguyên mọi field trong fields
// - mode "server" (local, test): không có Cloudinary → upload qua POST /uploads/video như cũ
export const VideoUploadSignatureRes = z.object({
  data: z.discriminatedUnion('mode', [
    z.object({
      mode: z.literal('cloudinary'),
      uploadUrl: z.string(),
      // Giá trị là chuỗi / số / boolean tùy field (timestamp là số, eager_async là boolean)
      fields: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
      maxBytes: z.number()
    }),
    z.object({
      mode: z.literal('server'),
      uploadUrl: z.string(),
      maxBytes: z.number()
    })
  ]),
  message: z.string()
})
export type VideoUploadSignatureResType = z.infer<typeof VideoUploadSignatureRes>

// Kết quả upload video, dù đi đường nào (Cloudinary trực tiếp hay qua server)
export type UploadedVideo = { url: string; durationSec?: number }

// Video: khớp backend (VIDEO_TYPES trong upload.middleware.ts).
// Dung lượng: backend mặc định 500 MB, nhưng bản deploy đặt MAX_VIDEO_MB=100 (giới hạn gói Cloudinary miễn phí)
export const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
export const MAX_VIDEO_MB = 100
