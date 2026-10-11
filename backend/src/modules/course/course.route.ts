import { Router } from 'express'
import * as courseController from './course.controller'
import { requireAuth, requirePermission } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.middleware'
import {
  CourseParamsSchema,
  CreateCourseBodySchema,
  GetMyCoursesQuerySchema,
  GetPendingCoursesQuerySchema,
  RejectCourseBodySchema,
  UpdateCourseBodySchema,
} from './course.schema'

const courseRouter = Router()

// ----- Giảng viên: khoá học của tôi -----
// ⚠️ Các route "/mine..." PHẢI khai báo TRƯỚC route "/:courseId" (xem giải thích bên dưới)
courseRouter.get(
  '/mine',
  requireAuth,
  requirePermission,
  validateQuery(GetMyCoursesQuerySchema),
  courseController.getMyCourses,
)
courseRouter.get(
  '/mine/:courseId',
  requireAuth,
  requirePermission,
  validateParams(CourseParamsSchema),
  courseController.getMyCourseById,
)

// ----- Admin: danh sách chờ duyệt (route cố định → cũng phải đứng trước "/:courseId") -----
courseRouter.get(
  '/pending',
  requireAuth,
  requirePermission,
  validateQuery(GetPendingCoursesQuerySchema),
  courseController.getPendingCourses,
)

courseRouter.post(
  '/',
  requireAuth,
  requirePermission,
  validateBody(CreateCourseBodySchema),
  courseController.createCourse,
)
courseRouter.put(
  '/:courseId',
  requireAuth,
  requirePermission,
  validateParams(CourseParamsSchema),
  validateBody(UpdateCourseBodySchema),
  courseController.updateCourse,
)
courseRouter.delete(
  '/:courseId',
  requireAuth,
  requirePermission,
  validateParams(CourseParamsSchema),
  courseController.deleteCourse,
)

// ----- Luồng duyệt: DRAFT/REJECTED → PENDING → PUBLISHED/REJECTED -----
courseRouter.post(
  '/:courseId/submit',
  requireAuth,
  requirePermission,
  validateParams(CourseParamsSchema),
  courseController.submitCourse,
)
courseRouter.post(
  '/:courseId/approve',
  requireAuth,
  requirePermission,
  validateParams(CourseParamsSchema),
  courseController.approveCourse,
)
courseRouter.post(
  '/:courseId/reject',
  requireAuth,
  requirePermission,
  validateParams(CourseParamsSchema),
  validateBody(RejectCourseBodySchema),
  courseController.rejectCourse,
)

export default courseRouter
