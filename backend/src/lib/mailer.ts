import { UnrecoverableError } from 'bullmq'
import nodemailer from 'nodemailer'
import envConfig from '../config/env'
import type { EmailJobData } from '../queues/email.queue'

// 2 cách gửi email, chọn theo biến môi trường (giống cổng thanh toán: điền biến nào thì bật cái đó):
//   - Có BREVO_API_KEY → gửi qua HTTP API của Brevo. Dùng khi deploy: Render chặn cổng SMTP
//   - Không có → SMTP. Dev: Mailpit (localhost:1025), xem thư ở http://localhost:8025
export const mailProvider = envConfig.BREVO_API_KEY ? 'brevo' : 'smtp'

const smtpTransport = nodemailer.createTransport({
  host: envConfig.SMTP_HOST,
  port: envConfig.SMTP_PORT,
  secure: envConfig.SMTP_SECURE,
  auth: envConfig.SMTP_USER ? { user: envConfig.SMTP_USER, pass: envConfig.SMTP_PASSWORD } : undefined,
})

// "Edu Platform <ban@gmail.com>" → { name: 'Edu Platform', email: 'ban@gmail.com' }. Brevo cần tách riêng
const parseAddress = (address: string) => {
  const match = address.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/)
  return match ? { name: match[1] || undefined, email: match[2] } : { email: address.trim() }
}

const sendViaBrevo = async ({ to, subject, html, text }: EmailJobData) => {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': envConfig.BREVO_API_KEY!, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender: parseAddress(envConfig.MAIL_FROM),
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
    signal: AbortSignal.timeout(30_000),
  })
  const data = (await res.json().catch(() => ({}))) as { messageId?: string; message?: string }
  if (!res.ok) {
    const message = `Brevo báo lỗi ${res.status}: ${data.message ?? res.statusText}`
    // 4xx (sai API key, người gửi chưa xác minh...): thử lại cũng sai → báo BullMQ dừng luôn.
    // 429 (quá giới hạn gửi) và 5xx (Brevo lỗi tạm thời): ném lỗi thường để BullMQ tự thử lại
    if (res.status >= 400 && res.status < 500 && res.status !== 429) throw new UnrecoverableError(message)
    throw new Error(message)
  }
  return { messageId: data.messageId }
}

const sendViaSmtp = async ({ to, subject, html, text }: EmailJobData) => {
  const info = await smtpTransport.sendMail({ from: envConfig.MAIL_FROM, to, subject, html, text })
  return { messageId: info.messageId }
}

// Ném lỗi (SMTP sập, Brevo lỗi...) → worker để BullMQ tự thử lại theo attempts/backoff của hàng đợi
export const sendMail = mailProvider === 'brevo' ? sendViaBrevo : sendViaSmtp
