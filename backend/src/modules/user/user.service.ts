import prisma from '../../lib/prisma'
import { HttpError } from '../../utils/error'
import { Prisma } from '../../generated/prisma/client'
import { UserStatus } from '../../generated/prisma/enums'
import { GetUsersQueryType, UpdateUserRoleBodyType, UpdateUserStatusBodyType } from './user.schema'

// Không bao giờ trả password, totpSecret ra ngoài
const userSelect = {
  id: true,
  email: true,
  name: true,
  phoneNumber: true,
  avatar: true,
  status: true,
  createdAt: true,
  role: { select: { id: true, name: true } },
} satisfies Prisma.UserSelect

export const getUsers = async ({ page, limit, search, roleId, status }: GetUsersQueryType) => {
  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    roleId,
    status,
    OR: search
      ? [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ]
      : undefined,
  }
  const [totalItems, data] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: 'desc' }, // mới đăng ký lên đầu
      select: userSelect,
    }),
  ])
  return { data, totalItems, page, limit, totalPages: Math.ceil(totalItems / limit) }
}

export const getUserById = async (userId: number) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      ...userSelect,
      // Số khóa đang dạy (chưa xóa) + số khóa đã ghi danh + số đánh giá đã viết
      _count: {
        select: {
          courses: { where: { deletedAt: null } },
          enrollments: true,
          reviews: true,
        },
      },
    },
  })
  if (!user) {
    throw new HttpError(404, 'Không tìm thấy người dùng')
  }
  const { _count, ...rest } = user
  return {
    ...rest,
    stats: { teachingCourses: _count.courses, enrolledCourses: _count.enrollments, reviews: _count.reviews },
  }
}

// Admin không được tự khóa / tự đổi role của chính mình (tránh tự khóa mình khỏi hệ thống)
const ensureNotSelf = (userId: number, adminId: number) => {
  if (userId === adminId) {
    throw new HttpError(403, 'Không thể thay đổi trạng thái hoặc role của chính bạn')
  }
}

export const updateUserStatus = async (userId: number, { status }: UpdateUserStatusBodyType, adminId: number) => {
  ensureNotSelf(userId, adminId)
  await getUserById(userId)
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { status, updatedById: adminId } })
    // Khóa → đăng xuất mọi thiết bị. (Access token còn hạn cũng bị requirePermission chặn ngay)
    if (status === UserStatus.BLOCKED) {
      await tx.refreshToken.deleteMany({ where: { userId } })
    }
  })
  return getUserById(userId)
}

export const updateUserRole = async (userId: number, { roleId }: UpdateUserRoleBodyType, adminId: number) => {
  ensureNotSelf(userId, adminId)
  await getUserById(userId)
  const role = await prisma.role.findFirst({ where: { id: roleId, deletedAt: null, isActive: true } })
  if (!role) {
    throw new HttpError(422, 'Dữ liệu không hợp lệ', [{ field: 'roleId', message: 'Role không tồn tại hoặc đã bị tắt' }])
  }
  // requirePermission đọc role từ DB → quyền mới có hiệu lực ngay ở request kế tiếp
  await prisma.user.update({ where: { id: userId }, data: { roleId, updatedById: adminId } })
  return getUserById(userId)
}
