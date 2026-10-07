import { Request, Response } from 'express'
import { LoginBodyType, RegisterBodyType } from './auth.schema'
import * as authService from './auth.service'

export const register = async (req: Request, res: Response) => {
  const user = await authService.register(req.body as RegisterBodyType)
  res.status(201).json({
    message: 'Đăng ký thành công',
    data: user,
  })
}

export const login = async (req: Request, res: Response) => {
  const user = await authService.login(req.body as LoginBodyType)
  res.status(200).json({
    message: 'Đăng nhập thành công',
    data: user,
  })
}

export const me = async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.userId)
  res.json({
    message: 'Lấy thông tin thành công',
    data: user,
  })
}
