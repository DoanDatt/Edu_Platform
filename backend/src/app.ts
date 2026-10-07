import express from 'express'

const app = express()

// đọc body json mà client gửi lên -> req.body
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Hello Wordl!' })
})

export default app
