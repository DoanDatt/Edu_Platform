import { Router } from 'express'
import * as authController from './auth.controller'
import { validateBody } from '../../middleware/validate.middleware'
import { LoginBodySchema, RegisterBodySchema } from './auth.schema'

const authRouter = Router()
// authRouter.post('/register', authController.register)
authRouter.post('/register', validateBody(RegisterBodySchema), authController.register)
authRouter.post('/login', validateBody(LoginBodySchema), authController.login)

export default authRouter
