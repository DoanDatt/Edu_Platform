import { Router } from 'express'
import * as authController from './auth.controller'
import { validateBody } from '../../middleware/validate.middleware'
import { LoginBodySchema, RefreshTokenBodySchema, RegisterBodySchema } from './auth.schema'
import { requireAuth } from '../../middleware/auth.middleware'

const authRouter = Router()
authRouter.post('/register', validateBody(RegisterBodySchema), authController.register)
authRouter.post('/login', validateBody(LoginBodySchema), authController.login)
authRouter.get('/me', requireAuth, authController.me)
authRouter.post('/refresh-token', validateBody(RefreshTokenBodySchema), authController.refreshToken)

export default authRouter
