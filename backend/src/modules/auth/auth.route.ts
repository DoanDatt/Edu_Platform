import { Router } from 'express'
import * as authController from './auth.controller'
import { validateBody } from '../../middleware/validate.middleware'
import { RegisterBodySchema } from './auth.schema'

const authRouter = Router()
// authRouter.post('/register', authController.register)
authRouter.post('/register', validateBody(RegisterBodySchema), authController.register)

export default authRouter
