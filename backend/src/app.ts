import express, { Router } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import envConfig from './config/env'
import { apiLimiter } from './middleware/rate-limit.middleware'
import uploadRouter from './modules/upload/upload.route'
import authRouter from './modules/auth/auth.route'
import { errorHandler, notFoundHandler } from './middleware/error.middleware'
import permissionRouter from './modules/permission/permission.route'
import roleRouter from './modules/role/role.route'
import categoryRouter from './modules/category/category.route'
import courseRouter from './modules/course/course.route'
import sectionRouter from './modules/section/section.route'
import lectureRouter from './modules/lecture/lecture.route'
import enrollmentRouter from './modules/enrollment/enrollment.route'
import reviewRouter from './modules/review/review.route'
import userRouter from './modules/user/user.route'
import statsRouter from './modules/stats/stats.route'
import profileRouter from './modules/profile/profile.route'
import notificationRouter from './modules/notification/notification.route'
import orderRouter from './modules/order/order.route'
import paymentRouter from './modules/payment/payment.route'

// Các router có route cần kiểm tra quyền theo bảng Permission.
// Script sync-permissions đọc danh sách này để sinh permission → thêm module mới thì thêm vào đây
export const protectedRouters: { prefix: string; router: Router }[] = [
  { prefix: '/permissions', router: permissionRouter },
  { prefix: '/roles', router: roleRouter },
  { prefix: '/categories', router: categoryRouter },
  { prefix: '/courses', router: courseRouter },
  { prefix: '/sections', router: sectionRouter },
  { prefix: '/lectures', router: lectureRouter },
  { prefix: '/enrollments', router: enrollmentRouter },
  { prefix: '/reviews', router: reviewRouter },
  { prefix: '/users', router: userRouter },
  { prefix: '/stats', router: statsRouter },
  // Upload ảnh / video (POST). Cùng prefix với file tĩnh /uploads (GET) bên dưới, không đụng nhau
  { prefix: '/uploads', router: uploadRouter },
]

const app = express()

// Chạy sau proxy (Render, Nginx...): IP thật của người dùng nằm trong header X-Forwarded-For.
// Không bật thì req.ip là IP của proxy → mọi người dùng chung 1 IP → rate limit khóa tất cả cùng lúc.
// TRUST_PROXY = số proxy đứng trước app (Render: 1). Chạy máy local: 0 (tắt)
if (envConfig.TRUST_PROXY > 0) app.set('trust proxy', envConfig.TRUST_PROXY)

// Header bảo mật (chống clickjacking, sniff MIME...). crossOriginResourcePolicy = cross-origin
// để frontend ở cổng khác vẫn hiển thị được ảnh / video trong /uploads
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

// CORS: trình duyệt chỉ cho frontend (khác cổng) gọi API khi server cho phép đúng origin đó
app.use(cors({ origin: envConfig.CORS_ORIGINS }))

// Log mỗi request: "GET /courses 200 12.3 ms" (tắt khi chạy test cho đỡ rối)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

// Chặn spam chung cho toàn bộ API (các route nhạy cảm có giới hạn riêng, chặt hơn)
app.use(apiLimiter)

// đọc body json mà client gửi lên -> req.body
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' })
})

// File đã upload: GET /uploads/images/<tên>.jpg. Hỗ trợ Range request nên video tua được
app.use('/uploads', express.static(envConfig.UPLOAD_DIR, { maxAge: '7d', index: false }))

app.use('/auth', authRouter)
// Hồ sơ của chính mình: chỉ cần đăng nhập, không cần permission
app.use('/profile', profileRouter)
// Thông báo của chính mình: cũng chỉ cần đăng nhập
app.use('/notifications', notificationRouter)
// Đơn mua khóa học của chính mình: cũng chỉ cần đăng nhập
app.use('/orders', orderRouter)
// Cổng thanh toán gọi về (MoMo IPN, SePay webhook): công khai, tự xác thực bằng chữ ký / API key
app.use('/payments', paymentRouter)
for (const { prefix, router } of protectedRouters) {
  app.use(prefix, router)
}
app.use(notFoundHandler)
app.use(errorHandler)

export default app
