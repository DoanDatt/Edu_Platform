import { afterAll, vi } from 'vitest'
import prisma from '../src/lib/prisma'
import type { EmailJobData } from '../src/queues/email.queue'

// Giả lập hàng đợi email: không cần Redis, và test đọc được email "đã gửi" (ví dụ lấy mã OTP)
declare global {
  var sentEmails: EmailJobData[]
}
globalThis.sentEmails = []

vi.mock('../src/queues/email.queue', () => {
  const capture = async (data: EmailJobData) => {
    globalThis.sentEmails.push(data)
  }
  return {
    EMAIL_QUEUE: 'email',
    enqueueEmail: vi.fn(capture),
    enqueueEmailSafely: vi.fn(capture),
    getEmailQueue: vi.fn(),
    closeEmailQueue: vi.fn(),
  }
})

afterAll(async () => {
  await prisma.$disconnect()
})
