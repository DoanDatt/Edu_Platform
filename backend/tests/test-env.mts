import { config } from 'dotenv'
import fs from 'fs'
import os from 'os'
import path from 'path'

// Biến môi trường cho lúc chạy test.
// Database test = database dev đổi tên thành "edu_platform_test" (hoặc lấy TEST_DATABASE_URL nếu có).
// Mỗi lần chạy test, database này bị XÓA SẠCH rồi dựng lại → tuyệt đối không được trỏ vào DB dev
export const buildTestEnv = () => {
  if (fs.existsSync('.env')) config({ path: '.env', quiet: true })

  const base = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
  if (!base) {
    throw new Error('Cần DATABASE_URL (trong .env) hoặc TEST_DATABASE_URL để chạy test')
  }
  const url = new URL(base)
  if (!process.env.TEST_DATABASE_URL) url.pathname = '/edu_platform_test'

  // Chốt an toàn: tên database phải kết thúc bằng _test
  if (!url.pathname.endsWith('_test')) {
    throw new Error(`Database test phải có tên kết thúc bằng "_test", đang là "${url.pathname}"`)
  }

  return {
    NODE_ENV: 'test',
    DATABASE_URL: url.toString(),
    RATE_LIMIT_ENABLED: 'false', // test gọi login rất nhiều lần
    RUN_WORKER: 'false',
    UPLOAD_DIR: path.join(os.tmpdir(), 'edu-platform-test-uploads'),
    // Test KHÔNG BAO GIỜ đẩy file lên Cloudinary thật (dù .env của máy có CLOUDINARY_URL): luôn lưu ổ đĩa
    CLOUDINARY_URL: '',
    // Cổng thanh toán: bật cả 3 bằng thông tin chỉ dành cho test (ghi đè .env), test mock fetch nên không gọi cổng thật.
    // MoMo dùng bộ khóa test công khai của MoMo (github.com/momo-wallet/payment)
    MOMO_PARTNER_CODE: 'MOMO',
    MOMO_ACCESS_KEY: 'F8BBA842ECF85',
    MOMO_SECRET_KEY: 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
    MOMO_ENDPOINT: 'https://momo.test',
    PAYPAL_CLIENT_ID: 'test-paypal-client',
    PAYPAL_CLIENT_SECRET: 'test-paypal-secret',
    PAYPAL_API: 'https://paypal.test',
    PAYPAL_VND_PER_USD: '25000',
    SEPAY_API_KEY: 'test-sepay-key',
    SEPAY_BANK: 'MBBank',
    SEPAY_ACCOUNT_NUMBER: '0123456789',
    SEPAY_ACCOUNT_NAME: 'EDU PLATFORM',
    PAYMENT_CODE_PREFIX: 'EDU',
    // Các biến bắt buộc: lấy từ .env nếu có, không thì dùng giá trị chỉ dành cho test (CI)
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET ?? 'test-access-secret',
    ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN ?? '15m',
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET ?? 'test-refresh-secret',
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d',
    ADMIN_NAME: 'Test Admin',
    ADMIN_EMAIL: 'admin@test.local',
    ADMIN_PASSWORD: 'Admin@12345',
    ADMIN_PHONE_NUMBER: '0900000000',
  }
}
