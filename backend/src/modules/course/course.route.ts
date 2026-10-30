import { Router } from 'express'
import * as courseController from './course.controller'
import * as commentController from '../comment/comment.controller'
import { CreateCommentBodySchema, GetCommentsQuerySchema } from '../comment/comment.schema'
import { commentLimiter } from '../../middleware/rate-limit.middleware'
import { optionalAuth, requireAuth, requirePermission } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.middleware'
import {
  CourseParamsSchema,
  CreateCourseBodySchema,
  GetAdminCoursesQuerySchema,
  GetCourseStudentsQuerySchema,
  GetCoursesQuerySchema,
  GetMyCoursesQuerySchema,
  GetPendingCoursesQuerySchema,
  RejectCourseBodySchema,
  UnpublishCourseBodySchema,
  UpdateCourseBodySchema,
} from './course.schema'

const courseRouter = Router()

// ----- Công khai: danh sách khóa đã xuất bản (tìm kiếm, lọc, sắp xếp) -----
courseRouter.get('/', validateQuery(GetCoursesQuerySchema), courseController.getPublicCourses)
// Cột lọc: lựa chọn + số khóa. Khai báo TRƯỚC "/:courseId" (không thì "filters" bị hiểu là courseId)
courseRouter.get('/filters', courseController.getCourseFilters)

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
// Học viên của khóa mình + tiến độ từng người
courseRouter.get(
  '/mine/:courseId/students',
  requireAuth,
  requirePermission,
  validateParams(CourseParamsSchema),
  validateQuery(GetCourseStudentsQuerySchema),
  courseController.getCourseStudents,
)

// ----- Admin: tất cả khóa học (mọi trạng thái) -----
courseRouter.get(
  '/admin',
  requireAuth,
  requirePermission,
  validateQuery(GetAdminCoursesQuerySchema),
  courseController.getAdminCourses,
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

// ----- Công khai: bình luận dưới trang chi tiết (form "Leave A Comment") -----
// Không gắn requirePermission: khách cũng xem / gửi được. optionalAuth: đang đăng nhập thì lấy tên + email từ tài khoản
courseRouter.get(
  '/:courseId/comments',
  validateParams(CourseParamsSchema),
  validateQuery(GetCommentsQuerySchema),
  commentController.getComments,
)
courseRouter.post(
  '/:courseId/comments',
  commentLimiter,
  optionalAuth,
  validateParams(CourseParamsSchema),
  validateBody(CreateCommentBodySchema),
  commentController.createComment,
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
// Admin gỡ khóa đang công khai: PUBLISHED → REJECTED (kèm lý do)
courseRouter.post(
  '/:courseId/unpublish',
  requireAuth,
  requirePermission,
  validateParams(CourseParamsSchema),
  validateBody(UnpublishCourseBodySchema),
  courseController.unpublishCourse,
)

export default courseRouter
