import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import * as permissionController from './permission.controller'

import { RoleName } from '../../constants/role'
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.middleware'
import {
  CreatePermissionBodySchema,
  GetPermissionQuerySchema,
  PermissionParamsSchema,
  UpdatePermissionBodySchema,
} from './permission.schema'

const permissionRouter = Router()

// áp dụng cho mọi route bên dưới: phải đăng nhập và là admin
permissionRouter.use(requireAuth, requireRole(RoleName.Admin))

permissionRouter.get('/', validateQuery(GetPermissionQuerySchema), permissionController.getPermissions)

permissionRouter.get('/:permissionId', validateParams(PermissionParamsSchema), permissionController.getPermissionById)

permissionRouter.post('/', validateBody(CreatePermissionBodySchema), permissionController.createPermission)

permissionRouter.put(
  '/:permissionId',
  validateParams(PermissionParamsSchema),
  validateBody(UpdatePermissionBodySchema),
  permissionController.updatePermission,
)

permissionRouter.delete('/:permissionId', validateParams(PermissionParamsSchema), permissionController.deletePermission)

export default permissionRouter
