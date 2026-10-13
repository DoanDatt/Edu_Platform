import { Router } from 'express'
import * as profileController from './profile.controller'
import { requireAuth } from '../../middleware/auth.middleware'
import { validateBody } from '../../middleware/validate.middleware'
import { ChangePasswordBodySchema, UpdateProfileBodySchema } from './profile.schema'

// Hồ sơ của CHÍNH MÌNH: ai đăng nhập cũng dùng được → chỉ cần requireAuth, không cần permission
const profileRouter = Router()
profileRouter.use(requireAuth)

profileRouter.get('/', profileController.getProfile)
profileRouter.put('/', validateBody(UpdateProfileBodySchema), profileController.updateProfile)
profileRouter.put('/password', validateBody(ChangePasswordBodySchema), profileController.changePassword)

export default profileRouter
