import { Router } from 'express'
import * as authController from './auth.controller'
import { validateBody } from '../../middleware/validate.middleware'
import {
  ForgotPasswordBodySchema,
  LoginBodySchema,
  LogoutBodySchema,
  RefreshTokenBodySchema,
  RegisterBodySchema,
  ResetPasswordBodySchema,
} from './auth.schema'
import { requireAuth } from '../../middleware/auth.middleware'
import {
  forgotPasswordLimiter,
  loginLimiter,
  registerLimiter,
  resetPasswordLimiter,
} from '../../middleware/rate-limit.middleware'

const authRouter = Router()
// Các limiter đặt ĐẦU route: quá số lần cho phép thì chặn luôn (429), không tốn công kiểm tra mật khẩu
authRouter.post('/register', registerLimiter, validateBody(RegisterBodySchema), authController.register)
authRouter.post('/login', loginLimiter, validateBody(LoginBodySchema), authController.login)
authRouter.get('/me', requireAuth, authController.me)
authRouter.post('/refresh-token', validateBody(RefreshTokenBodySchema), authController.refreshToken)
authRouter.post('/logout', validateBody(LogoutBodySchema), authController.logout)
// Quên mật khẩu: gửi OTP về email → nhập OTP + mật khẩu mới
authRouter.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validateBody(ForgotPasswordBodySchema),
  authController.forgotPassword,
)
authRouter.post(
  '/reset-password',
  resetPasswordLimiter,
  validateBody(ResetPasswordBodySchema),
  authController.resetPassword,
)

export default authRouter
