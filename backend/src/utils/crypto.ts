import bcrypt from 'bcrypt'
import { createHash, randomInt, timingSafeEqual } from 'crypto'

const SALT_ROUNDS = 10

export const hashPassword = (password: string) => bcrypt.hash(password, SALT_ROUNDS)

export const comparePassword = (password: string, hash: string) => bcrypt.compare(password, hash)

// Mã OTP 6 chữ số: randomInt của crypto (ngẫu nhiên an toàn), không dùng Math.random (đoán được)
export const generateOtp = () => randomInt(0, 1_000_000).toString().padStart(6, '0')

// Băm OTP trước khi lưu DB. OTP sống ngắn + giới hạn số lần nhập sai nên sha256 là đủ (bcrypt thì quá chậm)
export const hashOtp = (code: string) => createHash('sha256').update(code).digest('hex')

// So sánh với thời gian không đổi: không để lộ "đúng được mấy ký tự đầu" qua thời gian phản hồi
export const isOtpMatch = (code: string, hash: string) => {
  const a = Buffer.from(hashOtp(code), 'hex')
  const b = Buffer.from(hash, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}
