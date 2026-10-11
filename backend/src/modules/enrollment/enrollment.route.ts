import { Router } from 'express'
import * as enrollmentController from './enrollment.controller'
import { requireAuth, requirePermission } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.middleware'
import {
  CreateEnrollmentBodySchema,
  EnrollmentCourseParamsSchema,
  GetMyEnrollmentsQuerySchema,
} from './enrollment.schema'

const enrollmentRouter = Router()

// Ghi danh (tạm thời chỉ khóa miễn phí)
enrollmentRouter.post(
  '/',
  requireAuth,
  requirePermission,
  validateBody(CreateEnrollmentBodySchema),
  enrollmentController.enroll,
)
// Khóa học đã ghi danh + % tiến độ
enrollmentRouter.get(
  '/mine',
  requireAuth,
  requirePermission,
  validateQuery(GetMyEnrollmentsQuerySchema),
  enrollmentController.getMyEnrollments,
)
// Trang học một khóa: mục lục + bài đã xong
enrollmentRouter.get(
  '/mine/:courseId',
  requireAuth,
  requirePermission,
  validateParams(EnrollmentCourseParamsSchema),
  enrollmentController.getMyLearning,
)

export default enrollmentRouter
