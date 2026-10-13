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

const authRouter = Router()
authRouter.post('/register', validateBody(RegisterBodySchema), authController.register)
authRouter.post('/login', validateBody(LoginBodySchema), authController.login)
authRouter.get('/me', requireAuth, authController.me)
authRouter.post('/refresh-token', validateBody(RefreshTokenBodySchema), authController.refreshToken)
authRouter.post('/logout', validateBody(LogoutBodySchema), authController.logout)
// Quên mật khẩu: gửi OTP về email → nhập OTP + mật khẩu mới
authRouter.post('/forgot-password', validateBody(ForgotPasswordBodySchema), authController.forgotPassword)
authRouter.post('/reset-password', validateBody(ResetPasswordBodySchema), authController.resetPassword)

export default authRouter
