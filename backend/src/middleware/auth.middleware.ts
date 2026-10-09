import { HttpError } from '../utils/error'
import { verifyAccessToken } from '../utils/jwt'
import { RequestHandler } from 'express'

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

// Factory: nhận vào các role được phép, trả về 1 middleware
// DÙng sau: requireAuth: requireAuth, requireRole(RoleName.admin)
export const requireRole = (...roles: string[]): RequestHandler => {
  return (req, res, next) => {
    // Quên đặt ngoài requireAuth phía trước thì sẽ không có req.user
    if (!req.user) {
      throw new HttpError(401, 'Chưa đăng nhập')
    }
    if (!roles.includes(req.user.roleName)) {
      throw new HttpError(403, 'Bạn không có quyền truy cập')
    }
    next()
  }
}
