import { Router } from 'express'
import * as roleController from './role.controller'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.middleware'
import { RoleName } from '../../constants/role'
import { CreateRoleBodySchema, GetRolesQuerySchema, RoleParamsSchema, UpdateRoleBodySchema } from './role.schema'

const roleRouter = Router()

// Tạm thời chỉ admin, bước 5e sẽ thay bằng requirePermission
roleRouter.use(requireAuth, requireRole(RoleName.Admin))

roleRouter.get('/', validateQuery(GetRolesQuerySchema), roleController.getRoles)
roleRouter.get('/:roleId', validateParams(RoleParamsSchema), roleController.getRoleById)
roleRouter.post('/', validateBody(CreateRoleBodySchema), roleController.createRole)
roleRouter.put(
  '/:roleId',
  validateParams(RoleParamsSchema),
  validateBody(UpdateRoleBodySchema),
  roleController.updateRole,
)
roleRouter.delete('/:roleId', validateParams(RoleParamsSchema), roleController.deleteRole)

export default roleRouter
