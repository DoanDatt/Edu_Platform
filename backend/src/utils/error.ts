import { Prisma } from '../generated/prisma/client'

export type FieldError = { field: string; message: string }
export class HttpError extends Error {
  status: number
  errors?: FieldError[]

  constructor(status: number, message: string, errors?: FieldError[]) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

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
