import { Router } from 'express'
import * as lectureController from './lecture.controller'
import { requireAuth, requirePermission } from '../../middleware/auth.middleware'
import { validateBody, validateParams } from '../../middleware/validate.middleware'
import { CreateLectureBodySchema, LectureParamsSchema, UpdateLectureBodySchema } from './lecture.schema'

const lectureRouter = Router()

// Học viên / giảng viên / admin xem nội dung bài (service kiểm tra ghi danh, chủ khóa...)
lectureRouter.get(
  '/:lectureId',
  requireAuth,
  requirePermission,
  validateParams(LectureParamsSchema),
  lectureController.getLecture,
)

// Giảng viên soạn bài
lectureRouter.post(
  '/',
  requireAuth,
  requirePermission,
  validateBody(CreateLectureBodySchema),
  lectureController.createLecture,
)
lectureRouter.put(
  '/:lectureId',
  requireAuth,
  requirePermission,
  validateParams(LectureParamsSchema),
  validateBody(UpdateLectureBodySchema),
  lectureController.updateLecture,
)
lectureRouter.delete(
  '/:lectureId',
  requireAuth,
  requirePermission,
  validateParams(LectureParamsSchema),
  lectureController.deleteLecture,
)

export default lectureRouter
