import express from 'express'
import prisma from './lib/prisma'

const app = express()

// đọc body json mà client gửi lên -> req.body
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Hello Wordl!' })
})

app.get('/roles', async (req, res) => {
  // Tương đương SELECT * FROM "ROLE"
  const roles = await prisma.role.findMany()
  res.json(roles)
})

export default app
