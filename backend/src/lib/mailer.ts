import nodemailer from 'nodemailer'
import envConfig from '../config/env'

// Kết nối SMTP dùng chung. Dev: Mailpit (localhost:1025). Production: SMTP thật (Gmail, SES, Resend...)
export const mailer = nodemailer.createTransport({
  host: envConfig.SMTP_HOST,
  port: envConfig.SMTP_PORT,
  secure: envConfig.SMTP_SECURE,
  auth: envConfig.SMTP_USER ? { user: envConfig.SMTP_USER, pass: envConfig.SMTP_PASSWORD } : undefined,
})
