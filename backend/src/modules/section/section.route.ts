import { Router } from 'express'
import * as sectionController from './section.controller'
import { requireAuth, requirePermission } from '../../middleware/auth.middleware'
import { validateBody, validateParams } from '../../middleware/validate.middleware'
import {
  CreateSectionBodySchema,
  ReorderSectionsBodySchema,
  SectionParamsSchema,
  UpdateSectionBodySchema,
} from './section.schema'

const sectionRouter = Router()

// Xem mục lục: dùng GET /courses/mine/:courseId (giảng viên) hoặc trang chi tiết khóa học (công khai)

sectionRouter.post(
  '/',
  requireAuth,
  requirePermission,
  validateBody(CreateSectionBodySchema),
  sectionController.createSection,
)
// Route cố định "/reorder" phải đứng TRƯỚC "/:sectionId" (cùng method PUT)
sectionRouter.put(
  '/reorder',
  requireAuth,
  requirePermission,
  validateBody(ReorderSectionsBodySchema),
  sectionController.reorderSections,
)
sectionRouter.put(
  '/:sectionId',
  requireAuth,
  requirePermission,
  validateParams(SectionParamsSchema),
  validateBody(UpdateSectionBodySchema),
  sectionController.updateSection,
)
sectionRouter.delete(
  '/:sectionId',
  requireAuth,
  requirePermission,
  validateParams(SectionParamsSchema),
  sectionController.deleteSection,
)

export default sectionRouter
