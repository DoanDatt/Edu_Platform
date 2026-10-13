import { config } from 'dotenv'
import fs from 'fs'
import path from 'path'
import z from 'zod'

config({
  path: '.env',
})

// kiểm tra xem có file .env hay chưa
if (!fs.existsSync(path.resolve('.env'))) {
  console.log('Không tìm thấy file .env')
  process.exit(1)
}

const configSchema = z.object({
  PORT: z.coerce.number().default(4000),
  // Các địa chỉ frontend được phép gọi API, cách nhau bằng dấu phẩy
  // (mặc định: Vite 5173 và Next.js 3000 trên máy dev)
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://localhost:3000')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  DATABASE_URL: z.string(),
  ACCESS_TOKEN_SECRET: z.string(),
  ACCESS_TOKEN_EXPIRES_IN: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_EXPIRES_IN: z.string(),
  ADMIN_NAME: z.string(),
  ADMIN_EMAIL: z.email(),
  ADMIN_PASSWORD: z.string().min(8),
  ADMIN_PHONE_NUMBER: z.string(),

  // Redis cho hàng đợi BullMQ
  REDIS_URL: z.string().default('redis://localhost:6379'),
  // true: server chạy luôn worker xử lý hàng đợi (tiện cho dev).
  // false: tách worker ra process riêng (npm run worker), dùng khi deploy hoặc khi chạy test
  RUN_WORKER: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),

  // Gửi email qua SMTP. Mặc định trỏ vào Mailpit (docker compose) → xem thư ở http://localhost:8025
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().default('Edu Platform <no-reply@edu.local>'),
  // Địa chỉ frontend, dùng để tạo link trong email
  FRONTEND_URL: z.url().default('http://localhost:3000'),

  // Upload: file lưu trên ổ đĩa của server, phục vụ lại qua <PUBLIC_URL>/uploads/...
  PUBLIC_URL: z.url().default('http://localhost:4000'),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_IMAGE_MB: z.coerce.number().positive().default(5),
  MAX_VIDEO_MB: z.coerce.number().positive().default(500),

  // Giới hạn số request (chống dò mật khẩu, spam). Tắt khi chạy test tự động
  RATE_LIMIT_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
})

const configServer = configSchema.safeParse(process.env)

if (!configServer.success) {
  console.log('Các giá trị khai báo trong file .env không hợp lệ')
  console.error(configServer.error)
  process.exit(1)
}

const envConfig = configServer.data
export default envConfig
