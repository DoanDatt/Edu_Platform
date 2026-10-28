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
import { ReportWatchBodySchema } from '../enrollment/enrollment.schema'
import * as quizController from '../quiz/quiz.controller'
import { SaveQuizBodySchema, SubmitQuizBodySchema } from '../quiz/quiz.schema'

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

// ===== Xem video + quiz =====
// Chỉ cần đăng nhập, KHÔNG gắn requirePermission (giống /orders): service tự kiểm tra ghi danh / chủ khóa,
// và deploy không phải chạy lại sync-permissions cho các route mới này

// Trình phát báo đã xem bao lâu (~15 giây / lần). Xem đủ 90% → tự tính là học xong
lectureRouter.put(
  '/:lectureId/watch',
  requireAuth,
  validateParams(LectureParamsSchema),
  validateBody(ReportWatchBodySchema),
  enrollmentController.reportWatch,
)
// Học viên: lấy đề (không kèm đáp án) + kết quả cũ, nộp bài
lectureRouter.get(
  '/:lectureId/quiz',
  requireAuth,
  validateParams(LectureParamsSchema),
  quizController.getQuizForLearner,
)
lectureRouter.post(
  '/:lectureId/quiz/attempts',
  requireAuth,
  validateParams(LectureParamsSchema),
  validateBody(SubmitQuizBodySchema),
  quizController.submitQuiz,
)
// Giảng viên: lấy bộ câu hỏi kèm đáp án để soạn, lưu cả bộ
lectureRouter.get(
  '/:lectureId/quiz/edit',
  requireAuth,
  validateParams(LectureParamsSchema),
  quizController.getQuizForEditor,
)
lectureRouter.put(
  '/:lectureId/quiz',
  requireAuth,
  validateParams(LectureParamsSchema),
  validateBody(SaveQuizBodySchema),
  quizController.saveQuiz,
)

export default lectureRouter
