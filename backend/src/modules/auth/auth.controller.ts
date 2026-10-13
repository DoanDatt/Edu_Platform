import { Request, Response } from 'express'
import {
  ForgotPasswordBodyType,
  LoginBodyType,
  LogoutBodyType,
  RefreshTokenBodyType,
  RegisterBodyType,
  ResetPasswordBodyType,
} from './auth.schema'
import * as authService from './auth.service'

export const register = async (req: Request, res: Response) => {
  const result = await authService.register(req.body as RegisterBodyType)
  res.status(201).json({
    message: 'Đăng ký thành công',
    data: result,
  })
}

export const login = async (req: Request, res: Response) => {
  const result = await authService.login(req.body as LoginBodyType)
  res.status(200).json({
    message: 'Đăng nhập thành công',
    data: result,
  })
}

export const me = async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.userId)
  res.json({
    message: 'Lấy thông tin thành công',
    data: user,
  })
}

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body as RefreshTokenBodyType
  const tokens = await authService.refreshToken(refreshToken)
  res.json({ message: 'Lấy token mới thành công', data: tokens })
}

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body as LogoutBodyType
  await authService.logout(refreshToken)
  res.json({ message: 'Đăng xuất thành công' })
}

export const forgotPassword = async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body as ForgotPasswordBodyType)
  // Luôn cùng 1 câu trả lời, dù email có tồn tại hay không
  res.json({ message: 'Nếu email đã đăng ký, mã OTP đã được gửi. Mã có hiệu lực trong 10 phút' })
}

export const resetPassword = async (req: Request, res: Response) => {
  await authService.resetPassword(req.body as ResetPasswordBodyType)
  res.json({ message: 'Đặt lại mật khẩu thành công, vui lòng đăng nhập lại' })
}
