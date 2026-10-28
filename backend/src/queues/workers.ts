import { Worker } from 'bullmq'
import prisma from '../lib/prisma'
import { mailer } from '../lib/mailer'
import envConfig from '../config/env'
import { redisConnection } from './connection'
import { EMAIL_QUEUE, EmailJobData } from './email.queue'
import { CLEANUP_JOB, MAINTENANCE_QUEUE, scheduleMaintenanceJobs } from './maintenance.queue'
import { cancelExpiredOrders } from '../modules/order/order.service'

// Dọn dữ liệu đã hết hạn: xóa refresh token và mã OTP (bảng sẽ phình mãi nếu không dọn),
// hủy đơn hàng chờ thanh toán quá lâu
export const cleanupExpired = async () => {
  const now = new Date()
  const [tokens, codes, cancelledOrders] = await Promise.all([
    prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.verificationCode.deleteMany({ where: { expiresAt: { lt: now } } }),
    cancelExpiredOrders(),
  ])
  return { refreshTokens: tokens.count, verificationCodes: codes.count, cancelledOrders }
}

// Khởi động các worker. Trả về hàm đóng để tắt server êm (không bỏ dở job đang chạy)
export const startWorkers = async () => {
  const emailWorker = new Worker<EmailJobData>(
    EMAIL_QUEUE,
    async (job) => {
      const { to, subject, html, text } = job.data
      // Ném lỗi (SMTP sập...) → BullMQ tự thử lại theo attempts/backoff đã cấu hình ở queue
      const info = await mailer.sendMail({ from: envConfig.MAIL_FROM, to, subject, html, text })
      return { messageId: info.messageId }
    },
    { connection: redisConnection, concurrency: 5 }, // gửi tối đa 5 email cùng lúc
  )

  const maintenanceWorker = new Worker(
    MAINTENANCE_QUEUE,
    async (job) => {
      if (job.name === CLEANUP_JOB) return cleanupExpired()
    },
    { connection: redisConnection },
  )

  emailWorker.on('completed', (job) => console.log(`[email] Đã gửi "${job.data.subject}" → ${job.data.to}`))
  emailWorker.on('failed', (job, error) => {
    const attempts = `${job?.attemptsMade}/${job?.opts.attempts}`
    console.error(`[email] Gửi thất bại (lần ${attempts}) → ${job?.data.to}: ${error.message}`)
  })
  maintenanceWorker.on('completed', (job, result) => console.log(`[maintenance] ${job.name}:`, result))
  maintenanceWorker.on('failed', (job, error) => console.error(`[maintenance] ${job?.name} lỗi:`, error.message))

  await scheduleMaintenanceJobs()
  console.log('Worker đang chạy: email, maintenance (dọn dữ liệu hết hạn lúc 3h sáng)')

  return async () => {
    await Promise.all([emailWorker.close(), maintenanceWorker.close()])
  }
}
