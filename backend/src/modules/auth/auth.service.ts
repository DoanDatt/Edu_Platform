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

// db: mặc định là prisma thường; truyền tx khi cần chạy trong transaction (xem refreshToken)
const generateTokens = async ({ userId, roleName }: AccessTokenPayload, db: Prisma.TransactionClient = prisma) => {
  const accessToken = signAccessToken({ userId, roleName })
  const refreshToken = signRefreshToken({ userId })

  // lưu refresh token vào DB, để sau này refresh và logout kiểm tra được
  const { exp } = verifyRefreshToken(refreshToken)
  await db.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: new Date(exp * 1000), // exp tính bằng giây, Date cần mili giây
    },
  })
  return { accessToken, refreshToken }
}

export const register = async (body: RegisterBodyType) => {
  const studentRole = await prisma.role.findFirstOrThrow({
    where: { name: RoleName.Student },
  })
  const hashedPassword = await hashPassword(body.password)
  try {
    // Tạo user + cấp token trong CÙNG 1 transaction:
    // cấp token lỗi thì DB hoàn tác luôn việc tạo user, không để lại tài khoản "nửa vời"
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: body.email,
          name: body.name,
          phoneNumber: body.phoneNumber,
          password: hashedPassword,
          roleId: studentRole.id,
          status: 'ACTIVE',
        },
        select: { id: true, name: true, email: true },
      })
      // Đăng ký xong là đăng nhập luôn, trả về giống hệt login
      const tokens = await generateTokens({ userId: user.id, roleName: studentRole.name }, tx)
      return { ...tokens, account: { ...user, role: studentRole.name } }
    })
  } catch (error) {
    // P2002 = vi phạm unique, ở đây là email đã tồn tại
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new HttpError(409, 'Email đã được sử dụng')
    }
    throw error
  }
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

  // 4. Tạo access token + refresh token (refresh token được lưu DB)
  const tokens = await generateTokens({ userId: user.id, roleName: user.role.name })

  // 5. Kèm thông tin cơ bản để frontend hiển thị tên + điều hướng theo role ngay,
  // role trả dạng chuỗi ('ADMIN' | 'INSTRUCTOR' | 'STUDENT'). Thông tin đầy đủ xem GET /auth/me
  return {
    ...tokens,
    account: { id: user.id, name: user.name, email: user.email, role: user.role.name },
  }
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
  } catch {
    throw new HttpError(401, 'Refresh token không hợp lệ hoặc đã hết hạn')
  }

  // Xóa token cũ + tạo token mới trong CÙNG 1 transaction:
  // bước nào lỗi (DB đứt, user bị khóa...) thì DB hoàn tác cả việc xóa token cũ,
  // user không bị mất phiên đăng nhập giữa chừng
  return prisma.$transaction(async (tx) => {
    // Xóa refresh token cũ, không xóa được dòng nào nghĩa là token đã được dùng rồi hoặc đã logout
    const { count } = await tx.refreshToken.deleteMany({ where: { token } })
    if (count === 0) {
      throw new HttpError(401, 'Refresh token đã được sử dụng hoặc đã bị thu hồi')
    }

    // Lấy user hiện tại (có thể bị xóa hoặc bị khóa từ lúc đăng nhập)
    const user = await tx.user.findFirst({
      where: { id: payload.userId, deletedAt: null },
      include: { role: true },
    })
    if (!user) {
      throw new HttpError(401, 'Tài khoản không tồn tại')
    }
    if (user.status === 'BLOCKED') {
      throw new HttpError(403, 'Tài khoản của bạn đã bị khóa')
    }

    // Cấp token mới (ghi DB bằng tx để nằm trong transaction)
    return generateTokens({ userId: user.id, roleName: user.role.name }, tx)
  })
}

export const logout = async (token: string) => {
  // kiểm tra chữ ký
  try {
    verifyRefreshToken(token)
  } catch {
    throw new HttpError(401, 'Refresh token không hợp lệ hoặc đã hết hạn')
  }

  // Xóa refresh token khỏi DB, từ giờ token này không dùng để refresh được nữa
  const { count } = await prisma.refreshToken.deleteMany({
    where: { token },
  })
  if (count === 0) {
    throw new HttpError(401, 'Refresh token đã được sử dụng hoặc đã bị thu hồi')
  }
}
