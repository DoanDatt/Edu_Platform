import { Router } from 'express'
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.middleware'
import {
  CategoryParamsSchema,
  CreateCategoryBodySchema,
  GetCategoriesQuerySchema,
  UpdateCategoryBodySchema,
} from './category.schema'
import * as categoryController from './category.controller'
import { requireAuth, requirePermission } from '../../middleware/auth.middleware'

const categoryRouter = Router()

// Công khai: ai cũng xem được (không có requireAuth)
categoryRouter.get('/', validateQuery(GetCategoriesQuerySchema), categoryController.getCategories)
categoryRouter.get('/:categoryId', validateParams(CategoryParamsSchema), categoryController.getCategoryById)

// Cần đăng nhập + có permission
categoryRouter.post(
  '/',
  requireAuth,
  requirePermission,
  validateBody(CreateCategoryBodySchema),
  categoryController.createCategory,
)

categoryRouter.put(
  '/:categoryId',
  requireAuth,
  requirePermission,
  validateParams(CategoryParamsSchema),
  validateBody(UpdateCategoryBodySchema),
  categoryController.updateCategory,
)
categoryRouter.delete(
  '/:categoryId',
  requireAuth,
  requirePermission,
  validateParams(CategoryParamsSchema),
  categoryController.deleteCategory,
)

export default categoryRouter
