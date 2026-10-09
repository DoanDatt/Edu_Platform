import { HttpError } from '../utils/error'
import { verifyAccessToken } from '../utils/jwt'
import { RequestHandler } from 'express'
import { buildPermissionPath } from '../utils/permission-path'
import { HTTPMethod } from '../generated/prisma/enums'
import prisma from '../lib/prisma'

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

// Kiểm tra quyền theo bảng Permission trong DB.
// PHẢI đặt trong khai báo route: router.get('/', requirePermission, ...)
// (đặt bằng router.use thì req.route chưa có → không biết route nào)
export const requirePermission: RequestHandler = async (req, res, next) => {
  if (!req.user) {
    throw new HttpError(401, 'Chưa đăng nhập')
  }
  if (!req.route) {
    // Lỗi của lập trình viên (đặt sai chỗ), không phải lỗi của client → để thành 500
    throw new Error('requirePermission phải được đặt trong khai báo route, không dùng với router.use')
  }

  const method = req.method as HTTPMethod
  // '/roles' + '/:roleId' → '/roles/:roleId', ghép giống hệt script sync
  const path = buildPermissionPath(req.baseUrl, req.route.path)

  // 1 query: lấy trạng thái user + role + CHỈ permission khớp method/path đang gọi
  const user = await prisma.user.findFirst({
    where: { id: req.user.userId, deletedAt: null },
    select: {
      status: true,
      role: {
        select: {
          isActive: true,
          deletedAt: true,
          permissions: {
            where: { method, path, deletedAt: null },
            select: { id: true },
          },
        },
      },
    },
  })

  if (!user) {
    throw new HttpError(401, 'Tài khoản không còn tồn tại')
  }
  if (user.status === 'BLOCKED') {
    throw new HttpError(403, 'Tài khoản của bạn đã bị khoá')
  }
  if (!user.role.isActive || user.role.deletedAt) {
    throw new HttpError(403, 'Role của bạn đã bị vô hiệu hoá')
  }
  // Mảng rỗng = role không có permission này
  if (user.role.permissions.length === 0) {
    throw new HttpError(403, 'Bạn không có quyền truy cập')
  }
  next()
}
