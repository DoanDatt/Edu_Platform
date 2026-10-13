import express, { Router } from 'express'
import cors from 'cors'
import envConfig from './config/env'
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
]

const app = express()

// CORS: trình duyệt chỉ cho frontend (khác cổng) gọi API khi server cho phép đúng origin đó
app.use(cors({ origin: envConfig.CORS_ORIGINS }))

// đọc body json mà client gửi lên -> req.body
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' })
})
app.use('/auth', authRouter)
// Hồ sơ của chính mình: chỉ cần đăng nhập, không cần permission
app.use('/profile', profileRouter)
for (const { prefix, router } of protectedRouters) {
  app.use(prefix, router)
}
app.use(notFoundHandler)
app.use(errorHandler)

export default app
