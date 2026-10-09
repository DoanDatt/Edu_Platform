import { Router } from 'express'
import * as permissionController from './permission.controller'
import { requireAuth, requirePermission } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.middleware'
import {
  CreatePermissionBodySchema,
  GetPermissionQuerySchema,
  PermissionParamsSchema,
  UpdatePermissionBodySchema,
} from './permission.schema'

const permissionRouter = Router()

// Áp dụng cho mọi route bên dưới: phải đăng nhập
permissionRouter.use(requireAuth)

// requirePermission đặt ĐẦU MỖI ROUTE để biết đang gọi route nào (req.route)
permissionRouter.get(
  '/',
  requirePermission,
  validateQuery(GetPermissionQuerySchema),
  permissionController.getPermissions,
)
permissionRouter.get(
  '/:permissionId',
  requirePermission,
  validateParams(PermissionParamsSchema),
  permissionController.getPermissionById,
)
permissionRouter.post(
  '/',
  requirePermission,
  validateBody(CreatePermissionBodySchema),
  permissionController.createPermission,
)
permissionRouter.put(
  '/:permissionId',
  requirePermission,
  validateParams(PermissionParamsSchema),
  validateBody(UpdatePermissionBodySchema),
  permissionController.updatePermission,
)
permissionRouter.delete(
  '/:permissionId',
  requirePermission,
  validateParams(PermissionParamsSchema),
  permissionController.deletePermission,
)

export default permissionRouter
