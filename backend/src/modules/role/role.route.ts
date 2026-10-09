import { Router } from 'express'
import * as roleController from './role.controller'
import { requireAuth, requirePermission } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.middleware'
import { CreateRoleBodySchema, GetRolesQuerySchema, RoleParamsSchema, UpdateRoleBodySchema } from './role.schema'

const roleRouter = Router()

// Áp dụng cho mọi route bên dưới: phải đăng nhập
roleRouter.use(requireAuth)

// requirePermission đặt ĐẦU MỖI ROUTE để biết đang gọi route nào (req.route)
roleRouter.get('/', requirePermission, validateQuery(GetRolesQuerySchema), roleController.getRoles)
roleRouter.get('/:roleId', requirePermission, validateParams(RoleParamsSchema), roleController.getRoleById)
roleRouter.post('/', requirePermission, validateBody(CreateRoleBodySchema), roleController.createRole)
roleRouter.put(
  '/:roleId',
  requirePermission,
  validateParams(RoleParamsSchema),
  validateBody(UpdateRoleBodySchema),
  roleController.updateRole,
)
roleRouter.delete('/:roleId', requirePermission, validateParams(RoleParamsSchema), roleController.deleteRole)

export default roleRouter
