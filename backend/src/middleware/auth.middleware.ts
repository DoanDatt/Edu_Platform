import { RequestHandler } from 'express'
import { HttpError } from '../utils/error'
import { verifyAccessToken } from '../utils/jwt'

export const requireAuth: RequestHandler = (req, res, next) => {
  // Header dạng: "Bearer eyJhbGc..." → tách theo dấu cách
  const [type, token] = req.headers.authorization?.split(' ') ?? []
  if (type !== 'Bearer' || !token) {
    throw new HttpError(401, 'Thiếu access token')
  }
  try {
    req.user = verifyAccessToken(token)
  } catch {
    throw new HttpError(401, 'Access token không hợp lệ hoặc đã hết hạn')
  }
  next()
}
