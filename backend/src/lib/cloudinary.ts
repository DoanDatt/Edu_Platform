import { v2 as cloudinary } from 'cloudinary'
import envConfig from '../config/env'

// Đọc thông tin từ CLOUDINARY_URL (cloudinary://<api_key>:<api_secret>@<cloud_name>) và cấu hình rõ ràng,
// không dựa vào việc SDK tự đọc biến môi trường (phụ thuộc thứ tự import với dotenv)
const parseCloudinaryUrl = (value: string) => {
  const url = new URL(value)
  return {
    cloud_name: url.hostname,
    api_key: decodeURIComponent(url.username),
    api_secret: decodeURIComponent(url.password),
  }
}

export const isCloudinaryEnabled = Boolean(envConfig.CLOUDINARY_URL)

if (envConfig.CLOUDINARY_URL) {
  cloudinary.config({ ...parseCloudinaryUrl(envConfig.CLOUDINARY_URL), secure: true })
}

// Tải 1 file (đã lưu tạm trên đĩa) lên Cloudinary, trả link https công khai.
// Video có thêm duration (giây) do Cloudinary tự đọc → frontend khỏi phải tự đo
export const uploadToCloudinary = async (filePath: string, kind: 'images' | 'videos') => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: `edu-platform/${kind}`,
    resource_type: kind === 'videos' ? 'video' : 'image',
  })
  return {
    url: result.secure_url,
    durationSec: typeof result.duration === 'number' ? Math.round(result.duration) : undefined,
  }
}
