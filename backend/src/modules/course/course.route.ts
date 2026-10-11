import { Router } from 'express'
import * as courseController from './course.controller'
import { optionalAuth, requireAuth, requirePermission } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.middleware'
import {
  CourseParamsSchema,
  CreateCourseBodySchema,
  GetCoursesQuerySchema,
  GetMyCoursesQuerySchema,
  GetPendingCoursesQuerySchema,
  RejectCourseBodySchema,
  UpdateCourseBodySchema,
} from './course.schema'

const courseRouter = Router()

// ----- Công khai: danh sách khóa đã xuất bản (tìm kiếm, lọc, sắp xếp) -----
courseRouter.get('/', validateQuery(GetCoursesQuerySchema), courseController.getPublicCourses)

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
// Admin xem chi tiết khóa ở mọi trạng thái (kèm mục lục) để duyệt
courseRouter.get(
  '/admin/:courseId',
  requireAuth,
  requirePermission,
  validateParams(CourseParamsSchema),
  courseController.getCourseForAdmin,
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

// ----- Công khai: chi tiết khóa đã xuất bản -----
// Đặt SAU các route cố định "/mine", "/pending", "/admin/..." vì ":courseId" khớp mọi chữ.
// optionalAuth: đã đăng nhập thì trả thêm isEnrolled
courseRouter.get(
  '/:courseId',
  optionalAuth,
  validateParams(CourseParamsSchema),
  courseController.getPublicCourseById,
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
