import { v2 as cloudinary } from 'cloudinary'
import envConfig from '../config/env'
import { buildHlsUrl, HLS_EAGER, HLS_STREAMING_PROFILE } from '../utils/video'

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

const credentials = envConfig.CLOUDINARY_URL ? parseCloudinaryUrl(envConfig.CLOUDINARY_URL) : null

export const isCloudinaryEnabled = credentials !== null

if (credentials) {
  cloudinary.config({ ...credentials, secure: true })
}

// Upload video: đúng thư mục, chỉ nhận mp4 / webm / mov, và tạo sẵn bản HLS chạy nền (eager_async).
// Dạng object cho SDK (SDK tự ghép eager thành chuỗi "sp_hd/m3u8"; đưa chuỗi thẳng vào SDK sẽ bị hiểu sai)
export const HLS_EAGER_OPTION = { streaming_profile: HLS_STREAMING_PROFILE, format: 'm3u8' }
const VIDEO_FOLDER = 'edu-platform/videos'
const VIDEO_FORMATS = ['mp4', 'webm', 'mov']

// Cùng các tham số trên nhưng ở dạng thô của API Cloudinary: dùng để KÝ cho trình duyệt upload thẳng
export const VIDEO_UPLOAD_PARAMS = {
  folder: VIDEO_FOLDER,
  allowed_formats: VIDEO_FORMATS.join(','),
  eager: HLS_EAGER,
  eager_async: true,
}

// Tải 1 file (đã lưu tạm trên đĩa) lên Cloudinary, trả link https công khai.
// Video có thêm duration (giây) do Cloudinary tự đọc → frontend khỏi phải tự đo
export const uploadToCloudinary = async (filePath: string, kind: 'images' | 'videos') => {
  const result = await cloudinary.uploader.upload(
    filePath,
    kind === 'videos'
      ? {
          folder: VIDEO_FOLDER,
          allowed_formats: VIDEO_FORMATS,
          eager: [HLS_EAGER_OPTION],
          eager_async: true,
          resource_type: 'video',
        }
      : { folder: 'edu-platform/images', resource_type: 'image' },
  )
  return {
    url: result.secure_url,
    durationSec: typeof result.duration === 'number' ? Math.round(result.duration) : undefined,
  }
}

// Chữ ký cho trình duyệt upload video THẲNG lên Cloudinary (file không đi qua server của mình).
// Ký = SHA-1 của các tham số + api_secret. Trình duyệt phải gửi ĐÚNG các tham số đã ký,
// sửa folder / allowed_formats / eager là Cloudinary từ chối. api_secret không bao giờ rời server.
// Chữ ký hết hạn sau 1 giờ tính từ timestamp (Cloudinary tự kiểm tra)
export const signVideoUpload = (
  { cloud_name, api_key, api_secret }: { cloud_name: string; api_key: string; api_secret: string },
  timestamp: number,
) => {
  const params = { ...VIDEO_UPLOAD_PARAMS, timestamp }
  const signature = cloudinary.utils.api_sign_request(params, api_secret)
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`,
    // Gửi y nguyên các field này (cùng field "file") trong multipart/form-data
    fields: { ...params, api_key, signature },
  }
}

export const createVideoUploadSignature = () => {
  if (!credentials) return null
  return signVideoUpload(credentials, Math.floor(Date.now() / 1000))
}

// Link HLS của video bài giảng (null = không phải video Cloudinary của mình → phát mp4)
export const getHlsUrl = (videoUrl: string | null) => buildHlsUrl(videoUrl, credentials?.cloud_name)

// Yêu cầu Cloudinary tạo bản HLS cho video ĐÃ upload từ trước (trước khi có eager lúc upload)
export const generateHlsForExisting = (publicId: string) =>
  cloudinary.uploader.explicit(publicId, {
    type: 'upload',
    resource_type: 'video',
    eager: [HLS_EAGER_OPTION],
    eager_async: true,
  })
