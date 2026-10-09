import express from 'express'
import authRouter from './modules/auth/auth.route'
import { errorHandler, notFoundHandler } from './middleware/error.middleware'
import permissionRouter from './modules/permission/permission.route'
import roleRouter from './modules/role/role.route'

const app = express()

// đọc body json mà client gửi lên -> req.body
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Hello Wordl!' })
})

app.use('/auth', authRouter)
app.use('/permissions', permissionRouter) // thêm, phải đặt trước notFound
app.use('/roles', roleRouter) // ← thêm, vẫn đặt trước notFoundHandler
app.use(notFoundHandler)
app.use(errorHandler)

export default app
