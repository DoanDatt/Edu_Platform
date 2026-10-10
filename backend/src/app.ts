import express, { Router } from 'express'
import authRouter from './modules/auth/auth.route'
import { errorHandler, notFoundHandler } from './middleware/error.middleware'
import permissionRouter from './modules/permission/permission.route'
import roleRouter from './modules/role/role.route'

// Các router cần kiểm tra quyền theo bảng Permission.
// Script sync-permissions đọc danh sách này để sinh permission → thêm module mới thì thêm vào đây
export const protectedRouters: { prefix: string; router: Router }[] = [
  { prefix: '/permissions', router: permissionRouter },
  { prefix: '/roles', router: roleRouter },
]

const app = express()

// đọc body json mà client gửi lên -> req.body
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Hello Wordl!' })
})
app.use('/auth', authRouter)
for (const { prefix, router } of protectedRouters) {
  app.use(prefix, router)
}
app.use(notFoundHandler)
app.use(errorHandler)

export default app
