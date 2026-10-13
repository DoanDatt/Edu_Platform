import { Router } from 'express'
import * as userController from './user.controller'
import { requireAuth, requirePermission } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.middleware'
import {
  GetUsersQuerySchema,
  UpdateUserRoleBodySchema,
  UpdateUserStatusBodySchema,
  UserParamsSchema,
} from './user.schema'

// Admin quản lý người dùng
const userRouter = Router()
userRouter.use(requireAuth)

userRouter.get('/', requirePermission, validateQuery(GetUsersQuerySchema), userController.getUsers)
userRouter.get('/:userId', requirePermission, validateParams(UserParamsSchema), userController.getUserById)
userRouter.put(
  '/:userId/status',
  requirePermission,
  validateParams(UserParamsSchema),
  validateBody(UpdateUserStatusBodySchema),
  userController.updateUserStatus,
)
userRouter.put(
  '/:userId/role',
  requirePermission,
  validateParams(UserParamsSchema),
  validateBody(UpdateUserRoleBodySchema),
  userController.updateUserRole,
)

export default userRouter
