import { Request, Response } from 'express'
import { RegisterBodyType } from './auth.schema'
import * as authService from './auth.service'

export const register = async (req: Request, res: Response) => {
  const user = await authService.register(req.body as RegisterBodyType)
  res.status(201).json({
    message: 'Đăng ký thành công',
    data: user,
  })
}
