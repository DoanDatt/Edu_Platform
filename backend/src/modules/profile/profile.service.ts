import prisma from '../../lib/prisma'
import { HttpError } from '../../utils/error'
import { comparePassword, hashPassword } from '../../utils/crypto'
import { generateTokens, getMe } from '../auth/auth.service'
import { ChangePasswordBodyType, UpdateProfileBodyType } from './profile.schema'

// Hồ sơ = đúng dữ liệu của GET /auth/me (dùng chung 1 hàm cho khỏi lệch nhau)
export const getProfile = getMe

export const updateProfile = async (userId: number, body: UpdateProfileBodyType) => {
  await getMe(userId) // tài khoản phải còn tồn tại
  await prisma.user.update({
    where: { id: userId },
    // avatar: undefined → giữ nguyên, null → xóa, chuỗi → đổi
    data: { ...body, updatedById: userId },
  })
  return getMe(userId)
}

export const changePassword = async (
  userId: number,
  { currentPassword, newPassword }: ChangePasswordBodyType,
  roleName: string,
) => {
  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } })
  if (!user) {
    throw new HttpError(401, 'Tài khoản không còn tồn tại')
  }
  if (!(await comparePassword(currentPassword, user.password))) {
    throw new HttpError(422, 'Dữ liệu không hợp lệ', [
      { field: 'currentPassword', message: 'Mật khẩu hiện tại không đúng' },
    ])
  }

  const hashedPassword = await hashPassword(newPassword)
  // Đổi mật khẩu = đăng xuất MỌI thiết bị khác (xóa toàn bộ refresh token),
  // rồi cấp cặp token mới cho thiết bị đang dùng. Tất cả trong 1 transaction
  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { password: hashedPassword, updatedById: userId },
    })
    await tx.refreshToken.deleteMany({ where: { userId } })
    return generateTokens({ userId, roleName }, tx)
  })
}
