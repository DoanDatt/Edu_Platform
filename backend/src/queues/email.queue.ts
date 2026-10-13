import { Queue } from 'bullmq'
import { redisConnection, withTimeout } from './connection'
import { EmailContent } from '../emails/templates'

export const EMAIL_QUEUE = 'email'

export type EmailJobData = EmailContent & { to: string }

// Hàng đợi email. Gửi email chậm (vài giây) và có thể lỗi tạm thời (SMTP quá tải, mất mạng):
// đẩy vào hàng đợi để request trả về ngay, worker gửi sau và TỰ THỬ LẠI khi lỗi.
//
// Tạo LƯỜI (lần đầu cần mới tạo): nếu tạo ngay lúc import, mọi file import app.ts
// (script sync-permissions, seed...) đều mở kết nối Redis và không tự thoát được
let emailQueue: Queue<EmailJobData> | undefined

export const getEmailQueue = () => {
  emailQueue ??= new Queue<EmailJobData>(EMAIL_QUEUE, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 5, // thử tối đa 5 lần
      backoff: { type: 'exponential', delay: 10_000 }, // đợi 10s, 20s, 40s, 80s giữa các lần
      removeOnComplete: 1000, // chỉ giữ 1000 job thành công gần nhất trong Redis
      removeOnFail: 5000, // giữ job thất bại lâu hơn để còn kiểm tra
    },
  })
  return emailQueue
}

// Đẩy 1 email vào hàng đợi. Redis không phản hồi trong 3s → ném lỗi
export const enqueueEmail = (data: EmailJobData) => withTimeout(getEmailQueue().add('send', data))

// Với email "có cũng được" (chào mừng, thông báo): lỗi hàng đợi chỉ ghi log,
// KHÔNG làm hỏng request chính (đăng ký, duyệt khóa học...)
export const enqueueEmailSafely = async (data: EmailJobData) => {
  try {
    await enqueueEmail(data)
  } catch (error) {
    console.error(`[email] Không đưa được email "${data.subject}" vào hàng đợi:`, error)
  }
}

// Đóng kết nối (dùng khi tắt server / kết thúc test)
export const closeEmailQueue = async () => {
  await emailQueue?.close()
  emailQueue = undefined
}
