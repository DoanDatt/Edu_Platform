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
  VerifyOtpBodySchema,
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
// Quên mật khẩu: gửi OTP về email → kiểm tra OTP → OTP + mật khẩu mới
authRouter.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validateBody(ForgotPasswordBodySchema),
  authController.forgotPassword,
)
// Dùng chung limiter với reset-password: tổng số lần đoán mã qua 2 route vẫn bị giới hạn
authRouter.post('/verify-otp', resetPasswordLimiter, validateBody(VerifyOtpBodySchema), authController.verifyOtp)
authRouter.post(
  '/reset-password',
  resetPasswordLimiter,
  validateBody(ResetPasswordBodySchema),
  authController.resetPassword,
)

export default authRouter
