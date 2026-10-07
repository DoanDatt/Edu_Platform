import { RoleName } from '../../constants/role'
import { Prisma } from '../../generated/prisma/client'
import prisma from '../../lib/prisma'
import { comparePassword, hashPassword } from '../../utils/crypto'
import { HttpError } from '../../utils/error'
import {
  AccessTokenPayload,
  Decoded,
  RefreshTokenPayload,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt'
import { LoginBodyType, RegisterBodyType } from './auth.schema'

export const register = async (body: RegisterBodyType) => {
  const studentRole = await prisma.role.findFirstOrThrow({
    where: { name: RoleName.Student },
  })
  try {
    return await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        phoneNumber: body.phoneNumber,
        password: await hashPassword(body.password),
        roleId: studentRole.id,
        status: 'ACTIVE',
      },
      // Không bao giờ trả password ra ngoài
      omit: {
        password: true,
        totpSecret: true,
      },
    })
  } catch (error) {
    // P2002 = vi phạm unique, ở đây là email đã tồn tại
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new HttpError(409, 'Email đã được sử dụng')
    }
    throw error
  }
}

const generateTokens = async ({ userId, roleName }: AccessTokenPayload) => {
  const accessToken = signAccessToken({ userId, roleName })
  const refreshToken = signRefreshToken({ userId })

  // lưu refresh token vào DB, để sau này refresh và logout kiểm tra được
  const { exp } = verifyRefreshToken(refreshToken)
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: new Date(exp * 1000), // exp tính bằng giấy, Date cần mili giấy
    },
  })
  return { accessToken, refreshToken }
}

export const login = async (body: LoginBodyType) => {
  // 1. Tìm user theo email (bỏ qua user đã bị xoá mềm), lấy kèm role
  const user = await prisma.user.findFirst({
    where: { email: body.email, deletedAt: null },
    include: { role: true },
  })

  // 2. Kiểm tra mật khẩu. Không có user thì coi như sai mật khẩu
  const isPasswordValid = user ? await comparePassword(body.password, user.password) : false

  // Dùng CHUNG 1 câu báo lỗi cho "không có email" và "sai mật khẩu"
  // để kẻ xấu không dò được email nào đã đăng ký
  if (!user || !isPasswordValid) {
    throw new HttpError(401, 'Email hoặc mật khẩu không đúng')
  }

  // 3. Tài khoản bị khoá thì không cho đăng nhập
  if (user.status === 'BLOCKED') {
    throw new HttpError(403, 'Tài khoản của bạn đã bị khoá')
  }

  // // 4. Tạo access token và refresh token
  // const accessToken = signAccessToken({ userId: user.id, roleName: user.role.name })
  // const refreshToken = signRefreshToken({ userId: user.id })

  // // 5. Lưu refresh token vào DB, để sau này refresh và logout kiểm tra được
  // const { exp } = verifyRefreshToken(refreshToken)
  // await prisma.refreshToken.create({
  //   data: {
  //     token: refreshToken,
  //     userId: user.id,
  //     expiresAt: new Date(exp * 1000), // exp tính bằng giây, Date cần mili-giây
  //   },
  // })

  return generateTokens({ userId: user.id, roleName: user.role.name })
}

export const getMe = async (userId: number) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    omit: {
      password: true,
      totpSecret: true,
    },
    include: { role: { select: { id: true, name: true } } },
  })
  if (!user) {
    throw new HttpError(401, 'Tài khoản không còn tồn tại')
  }
  return user
}

export const refreshToken = async (token: string) => {
  // Kiểm tra chữ ký và hạn dùng
  let payload: Decoded<RefreshTokenPayload>
  try {
    payload = verifyRefreshToken(token)
  } catch (error) {
    throw new HttpError(401, 'Refresh token không hợp lệ hoặc đã hết hạn')
  }
  // Xóa refresh token cũ, không xóa được dòng nào nghĩa là token đã được dùng rồi hoặc đã logout
  const { count } = await prisma.refreshToken.deleteMany({ where: { token } })
  if (count === 0) {
    throw new HttpError(401, 'Refresh token đã được sử dụng hoặc đã bị thu hồi')
  }

  // Lấy user hiện tại(có thể bị xóa hoặc bị khóa từ lúc đăng nhập)
  const user = await prisma.user.findFirst({
    where: { id: payload.userId, deletedAt: null },
    include: { role: true },
  })
  if (!user) {
    throw new HttpError(401, 'Tài khoản không tồn tại')
  }
  if (user.status === 'BLOCKED') {
    throw new HttpError(403, 'Tài khoản của bạn đã bị khóa')
  }

  // Cấp token mới
  return generateTokens({ userId: user.id, roleName: user.role.name })
}
