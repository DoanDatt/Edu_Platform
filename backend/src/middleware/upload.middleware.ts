import multer from 'multer'
import path from 'path'
import { randomUUID } from 'crypto'
import envConfig from '../config/env'
import { HttpError } from '../utils/error'

// Loại file được phép + đuôi file tương ứng.
// Tên file lưu trên đĩa do SERVER đặt (uuid + đuôi theo loại), không dùng tên client gửi
// (tên client có thể chứa "../" hoặc ký tự lạ)
export const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}
export const VIDEO_TYPES: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
}

const MB = 1024 * 1024

const createUploader = (folder: 'images' | 'videos', allowed: Record<string, string>, maxMb: number) =>
  multer({
    storage: multer.diskStorage({
      // destination là chuỗi → multer tự tạo thư mục nếu chưa có
      destination: path.join(envConfig.UPLOAD_DIR, folder),
      filename: (req, file, cb) => cb(null, `${randomUUID()}${allowed[file.mimetype]}`),
    }),
    limits: { fileSize: maxMb * MB, files: 1 },
    // Lọc sơ bộ theo Content-Type (sau khi lưu còn kiểm tra chữ ký file ở controller)
    fileFilter: (req, file, cb) => {
      if (allowed[file.mimetype]) return cb(null, true)
      cb(
        new HttpError(422, 'Dữ liệu không hợp lệ', [
          { field: 'file', message: `Chỉ chấp nhận: ${Object.values(allowed).join(', ')}` },
        ]),
      )
    },
  }).single('file') // client gửi multipart/form-data, field tên "file"

export const uploadImage = createUploader('images', IMAGE_TYPES, envConfig.MAX_IMAGE_MB)
export const uploadVideo = createUploader('videos', VIDEO_TYPES, envConfig.MAX_VIDEO_MB)
