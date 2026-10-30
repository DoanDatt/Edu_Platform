import { config } from 'dotenv'
import fs from 'fs'
import path from 'path'
import z from 'zod'

// Có file .env thì đọc (máy dev). Không có thì dùng biến môi trường có sẵn (CI, Docker, server).
// dotenv KHÔNG ghi đè biến đã có → test / CI đặt DATABASE_URL riêng thì vẫn được giữ.
// Thiếu biến bắt buộc nào thì bước kiểm tra Zod bên dưới sẽ báo
if (fs.existsSync(path.resolve('.env'))) {
  config({ path: '.env', quiet: true })
}

// Biến tùy chọn: chuỗi rỗng = không có (test đặt '' để tắt hẳn, vì dotenv không ghi đè biến đã có)
const optionalString = z.preprocess((value) => (value === '' ? undefined : value), z.string().optional())

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
  // Brevo (gửi email qua HTTP API). Có key → dùng Brevo thay SMTP. Deploy trên Render bắt buộc
  // vì Render chặn cổng SMTP. Địa chỉ trong MAIL_FROM phải là người gửi đã xác minh trên Brevo
  BREVO_API_KEY: optionalString,
  MAIL_FROM: z.string().default('Edu Platform <no-reply@edu.local>'),
  // Địa chỉ frontend, dùng để tạo link trong email
  FRONTEND_URL: z.url().default('http://localhost:3000'),

  // Upload: file lưu trên ổ đĩa của server, phục vụ lại qua <PUBLIC_URL>/uploads/...
  PUBLIC_URL: z.url().default('http://localhost:4000'),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_IMAGE_MB: z.coerce.number().positive().default(5),
  MAX_VIDEO_MB: z.coerce.number().positive().default(500),

  // Cloudinary: có thì ảnh / video upload lên Cloudinary (deploy: ổ đĩa Render bị xóa khi khởi động lại).
  // Không có thì lưu ổ đĩa server như cũ (máy local, test). Dạng cloudinary://<api_key>:<api_secret>@<cloud_name>
  // Chuỗi rỗng = không có (test đặt CLOUDINARY_URL='' để tắt hẳn: dotenv không ghi đè biến đã có, kể cả rỗng)
  CLOUDINARY_URL: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z
      .string()
      .startsWith('cloudinary://', 'CLOUDINARY_URL phải có dạng cloudinary://<api_key>:<api_secret>@<cloud_name>')
      .optional(),
  ),

  // Tiền tố mã đơn hàng (EDU + 8 ký tự). SePay dùng nó để nhận ra mã đơn trong nội dung chuyển khoản
  // → phải trùng với "Cấu trúc mã thanh toán" cấu hình trên my.sepay.vn
  PAYMENT_CODE_PREFIX: z
    .string()
    .regex(/^[A-Z]{2,5}$/, 'PAYMENT_CODE_PREFIX: 2–5 chữ cái in hoa')
    .default('EDU'),

  // ===== Cổng thanh toán: điền đủ biến của cổng nào thì cổng đó được bật (GET /payments/methods) =====

  // MoMo (môi trường test). Thông tin test công khai của MoMo: github.com/momo-wallet/payment
  MOMO_PARTNER_CODE: optionalString,
  MOMO_ACCESS_KEY: optionalString,
  MOMO_SECRET_KEY: optionalString,
  MOMO_ENDPOINT: z.url().default('https://test-payment.momo.vn'),
  // payWithATM: trả bằng thẻ ATM nội địa (MoMo test có thẻ ATM test). captureWallet: quét QR bằng app MoMo
  MOMO_REQUEST_TYPE: z.enum(['payWithATM', 'captureWallet']).default('payWithATM'),

  // PayPal (sandbox). PayPal không nhận VND → đổi sang USD theo tỉ giá cố định bên dưới
  PAYPAL_CLIENT_ID: optionalString,
  PAYPAL_CLIENT_SECRET: optionalString,
  PAYPAL_API: z.url().default('https://api-m.sandbox.paypal.com'),
  PAYPAL_VND_PER_USD: z.coerce.number().positive().default(25_000),

  // SePay: chuyển khoản ngân hàng THẬT. SePay đọc biến động số dư rồi gọi webhook kèm header "Apikey <key>"
  SEPAY_API_KEY: optionalString,
  // Ngân hàng nhận tiền (tên viết tắt hoặc mã BIN, vd: MBBank, VCB, 970422), số tài khoản, tên chủ tài khoản
  SEPAY_BANK: optionalString,
  SEPAY_ACCOUNT_NUMBER: optionalString,
  SEPAY_ACCOUNT_NAME: optionalString,

  // Số proxy đứng trước app khi deploy (Render: 1) để đọc đúng IP người dùng. Local: 0
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),

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
