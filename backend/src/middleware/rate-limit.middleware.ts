import { rateLimit } from 'express-rate-limit'
import envConfig from '../config/env'

// Giới hạn số request theo IP trong một khoảng thời gian. Quá giới hạn → 429 Too Many Requests.
// Lưu đếm trong RAM: đủ cho 1 server. Chạy nhiều server thì đổi store sang Redis (rate-limit-redis)
const createLimiter = (windowMinutes: number, limit: number, message: string, onlyCountFailures = false) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-8', // trả header RateLimit-* để client biết còn bao nhiêu lượt
    legacyHeaders: false,
    message: { message },
    // true: request thành công (status < 400) không bị tính vào giới hạn
    skipSuccessfulRequests: onlyCountFailures,
    skip: () => !envConfig.RATE_LIMIT_ENABLED,
  })

// Toàn bộ API: rộng rãi, chỉ chặn spam bất thường
export const apiLimiter = createLimiter(15, 1000, 'Bạn gửi quá nhiều yêu cầu, vui lòng thử lại sau ít phút')

// Đăng nhập: chặn dò mật khẩu. Chỉ đếm lần đăng nhập SAI (đăng nhập đúng không bị trừ lượt)
export const loginLimiter = createLimiter(15, 10, 'Đăng nhập sai quá nhiều lần, vui lòng thử lại sau 15 phút', true)

// Đăng ký: chặn tạo tài khoản rác hàng loạt
export const registerLimiter = createLimiter(60, 10, 'Tạo quá nhiều tài khoản, vui lòng thử lại sau')

// Xin mã OTP: chặn spam email
export const forgotPasswordLimiter = createLimiter(15, 5, 'Yêu cầu mã quá nhiều lần, vui lòng thử lại sau 15 phút')

// Nhập mã OTP: chặn đoán mã (mỗi mã còn tự hủy sau 5 lần sai)
export const resetPasswordLimiter = createLimiter(15, 10, 'Thao tác quá nhiều lần, vui lòng thử lại sau 15 phút')

// Bình luận khóa học (khách cũng gửi được): chặn spam bình luận
export const commentLimiter = createLimiter(15, 10, 'Bạn bình luận quá nhiều, vui lòng thử lại sau ít phút')

// Form liên hệ: mỗi tin gửi kèm 1 email cho admin → giới hạn chặt hơn
export const contactLimiter = createLimiter(60, 5, 'Bạn đã gửi quá nhiều tin nhắn, vui lòng thử lại sau')
