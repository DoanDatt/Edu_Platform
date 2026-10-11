import { Router } from 'express'
import * as sectionController from './section.controller'
import { requireAuth, requirePermission } from '../../middleware/auth.middleware'
import { validateBody, validateParams } from '../../middleware/validate.middleware'
import { CreateSectionBodySchema, SectionParamsSchema, UpdateSectionBodySchema } from './section.schema'

const sectionRouter = Router()

// Xem mục lục: dùng GET /courses/mine/:courseId (giảng viên) hoặc trang chi tiết khóa học (công khai)

sectionRouter.post(
  '/',
  requireAuth,
  requirePermission,
  validateBody(CreateSectionBodySchema),
  sectionController.createSection,
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
