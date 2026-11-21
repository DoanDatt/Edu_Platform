import { Prisma } from '../generated/prisma/client'

export type FieldError = { field: string; message: string }
// Mã lỗi cố định cho các trường hợp frontend cần xử lý riêng (message là câu chữ, có thể sửa / dịch,
// nên frontend KHÔNG so khớp message mà so khớp code)
export type ErrorCode = 'ACCOUNT_BLOCKED'

export class HttpError extends Error {
  status: number
  errors?: FieldError[]
  code?: ErrorCode

  constructor(status: number, message: string, errors?: FieldError[], code?: ErrorCode) {
    super(message)
    this.status = status
    this.errors = errors
    this.code = code
  }
}

// Tài khoản bị admin khóa: dùng chung cho đăng nhập, làm mới token và mọi request cần đăng nhập
// → cùng 1 câu, cùng 1 mã. Frontend thấy code ACCOUNT_BLOCKED thì đăng xuất luôn
export const accountBlockedError = () => new HttpError(403, 'Tài khoản của bạn đã bị khóa', undefined, 'ACCOUNT_BLOCKED')

// Chạy 1 lệnh ghi DB; nếu vi phạm unique index (P2002) thì đổi thành 409 với message cho trước.
// Dùng sau bước "tìm trước rồi mới tạo": 2 request cùng lúc có thể cùng lọt qua bước tìm,
// lúc đó chính unique index trong DB chặn lại và ta vẫn trả 409 thay vì 500
export const onUniqueViolation = async <T>(write: Promise<T>, message: string): Promise<T> => {
  try {
    return await write
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new HttpError(409, message)
    }
    throw error
  }
}
