import express from 'express'
import authRouter from './modules/auth/auth.route'

const app = express()

// đọc body json mà client gửi lên -> req.body
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Hello Wordl!' })
})

app.use('/auth', authRouter)

export default app
