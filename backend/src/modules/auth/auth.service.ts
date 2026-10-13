import { RoleName } from '../../constants/role'
import { Prisma } from '../../generated/prisma/client'
import prisma from '../../lib/prisma'
import { comparePassword, generateOtp, hashOtp, hashPassword, isOtpMatch } from '../../utils/crypto'
import { HttpError } from '../../utils/error'
import { VerificationCodeType } from '../../generated/prisma/enums'
import { enqueueEmail, enqueueEmailSafely } from '../../queues/email.queue'
import { passwordChangedEmail, passwordResetOtpEmail, welcomeEmail } from '../../emails/templates'
import {
  AccessTokenPayload,
  Decoded,
  RefreshTokenPayload,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt'
import {
  ForgotPasswordBodyType,
  LoginBodyType,
  RegisterBodyType,
  ResetPasswordBodyType,
} from './auth.schema'

// db: mặc định là prisma thường; truyền tx khi cần chạy trong transaction (xem refreshToken).
// export để module profile cấp token mới sau khi đổi mật khẩu
export const generateTokens = async ({ userId, roleName }: AccessTokenPayload, db: Prisma.TransactionClient = prisma) => {
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
  let result
  try {
    // Tạo user + cấp token trong CÙNG 1 transaction:
    // cấp token lỗi thì DB hoàn tác luôn việc tạo user, không để lại tài khoản "nửa vời"
    result = await prisma.$transaction(async (tx) => {
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

  // Email chào mừng: đẩy vào hàng đợi, lỗi cũng không ảnh hưởng việc đăng ký
  await enqueueEmailSafely({ to: result.account.email, ...welcomeEmail(result.account.name) })
  return result
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

// ===== Quên mật khẩu (OTP qua email) =====

const OTP_EXPIRES_MINUTES = 10
const OTP_RESEND_SECONDS = 60
const OTP_MAX_ATTEMPTS = 5

// Bước 1: gửi mã OTP 6 số về email.
// LUÔN trả về cùng 1 kết quả dù email có tồn tại hay không → kẻ xấu không dò được email nào đã đăng ký
export const forgotPassword = async ({ email }: ForgotPasswordBodyType) => {
  const user = await prisma.user.findFirst({ where: { email, deletedAt: null, status: 'ACTIVE' } })
  if (!user) return

  // Vừa gửi trong 60 giây trước → không gửi thêm (chống spam email), nhưng vẫn trả về như bình thường
  const existing = await prisma.verificationCode.findUnique({ where: { email } })
  if (existing && Date.now() - existing.createdAt.getTime() < OTP_RESEND_SECONDS * 1000) return

  const code = generateOtp()
  const data = {
    code: hashOtp(code),
    type: VerificationCodeType.FORGOT_PASSWORD,
    attempts: 0,
    expiresAt: new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000),
    createdAt: new Date(),
  }
  // Mỗi email chỉ có 1 mã còn hiệu lực: gửi mã mới thì mã cũ bị thay
  await prisma.verificationCode.upsert({ where: { email }, create: { email, ...data }, update: data })

  // Email OTP là BẮT BUỘC (không có thì không đặt lại được mật khẩu) → hàng đợi lỗi thì báo lỗi cho client
  try {
    await enqueueEmail({ to: email, ...passwordResetOtpEmail(user.name, code, OTP_EXPIRES_MINUTES) })
  } catch (error) {
    console.error('[forgot-password] Không đưa được email vào hàng đợi:', error)
    throw new HttpError(503, 'Hệ thống gửi email đang bận, vui lòng thử lại sau')
  }
}

// Bước 2: nhập mã OTP + mật khẩu mới
export const resetPassword = async ({ email, code, newPassword }: ResetPasswordBodyType) => {
  // Cùng 1 câu lỗi cho mọi trường hợp sai (không có mã, hết hạn, sai mã...) để không lộ thông tin
  const invalidCode = new HttpError(422, 'Dữ liệu không hợp lệ', [
    { field: 'code', message: 'Mã OTP không đúng hoặc đã hết hạn' },
  ])

  const record = await prisma.verificationCode.findUnique({ where: { email } })
  if (
    !record ||
    record.type !== VerificationCodeType.FORGOT_PASSWORD ||
    record.expiresAt < new Date() ||
    record.attempts >= OTP_MAX_ATTEMPTS
  ) {
    throw invalidCode
  }

  if (!isOtpMatch(code, record.code)) {
    // Sai → tăng số lần thử. Đủ 5 lần thì mã vô hiệu, phải xin mã mới
    await prisma.verificationCode.update({ where: { email }, data: { attempts: { increment: 1 } } })
    throw invalidCode
  }

  const user = await prisma.user.findFirst({ where: { email, deletedAt: null } })
  if (!user) {
    throw invalidCode
  }

  const hashedPassword = await hashPassword(newPassword)
  // Đổi mật khẩu + đăng xuất mọi thiết bị + xóa mã (dùng 1 lần) trong cùng 1 transaction
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } }),
    prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
    prisma.verificationCode.delete({ where: { email } }),
  ])

  // Báo cho chủ tài khoản biết mật khẩu vừa đổi (phòng trường hợp không phải họ làm)
  await enqueueEmailSafely({ to: email, ...passwordChangedEmail(user.name) })
}
