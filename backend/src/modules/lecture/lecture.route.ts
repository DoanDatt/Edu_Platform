import { Router } from 'express'
import * as lectureController from './lecture.controller'
import * as enrollmentController from '../enrollment/enrollment.controller'
import { requireAuth, requirePermission } from '../../middleware/auth.middleware'
import { validateBody, validateParams } from '../../middleware/validate.middleware'
import {
  CreateLectureBodySchema,
  LectureParamsSchema,
  ReorderLecturesBodySchema,
  UpdateLectureBodySchema,
} from './lecture.schema'

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
// Route cố định "/reorder" phải đứng TRƯỚC "/:lectureId" (cùng method PUT)
lectureRouter.put(
  '/reorder',
  requireAuth,
  requirePermission,
  validateBody(ReorderLecturesBodySchema),
  lectureController.reorderLectures,
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

// Học viên đánh dấu / bỏ đánh dấu đã học xong (logic nằm ở module enrollment)
lectureRouter.post(
  '/:lectureId/complete',
  requireAuth,
  requirePermission,
  validateParams(LectureParamsSchema),
  enrollmentController.completeLecture,
)
lectureRouter.delete(
  '/:lectureId/complete',
  requireAuth,
  requirePermission,
  validateParams(LectureParamsSchema),
  enrollmentController.uncompleteLecture,
)

export default lectureRouter
