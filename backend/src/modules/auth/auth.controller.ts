import { Request, Response } from 'express'
import { RegisterBodySchema } from './auth.schema'
import * as authService from './auth.service'
import { HttpError } from '../../utils/error'

export const register = async (req: Request, res: Response) => {
  // kiểm tra body
  const result = RegisterBodySchema.safeParse(req.body)
  if (!result.success) {
    res.status(422).json({
      message: 'Dữ liệu không hợp lệ',
      error: result.error.issues.map((issuse) => ({
        field: issuse.path.join('.'),
        message: issuse.message,
      })),
    })
    return
  }
  // Gọi service
  try {
    const user = await authService.register(result.data)
    res.status(201).json({
      message: 'Đăng ký thành công',
      data: user,
    })
  } catch (error) {
    if (error instanceof HttpError) {
      res.status(error.status).json({
        message: error.message,
      })
      return
    }
    throw error
  }
}
