import { Router } from 'express'
import * as reviewController from './review.controller'
import { requireAuth, requirePermission } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.middleware'
import {
  CreateReviewBodySchema,
  GetFeaturedReviewsQuerySchema,
  GetReviewsQuerySchema,
  ReviewCourseParamsSchema,
  ReviewParamsSchema,
  UpdateReviewBodySchema,
} from './review.schema'

const reviewRouter = Router()

// Công khai: đánh giá của một khóa đã xuất bản
reviewRouter.get('/', validateQuery(GetReviewsQuerySchema), reviewController.getReviews)
// Công khai: đánh giá nổi bật cho trang chủ ("/featured" là route cố định, đứng trước các route có tham số)
reviewRouter.get('/featured', validateQuery(GetFeaturedReviewsQuerySchema), reviewController.getFeaturedReviews)

// Route cố định "/mine/..." đứng trước "/:reviewId"
reviewRouter.get(
  '/mine/:courseId',
  requireAuth,
  requirePermission,
  validateParams(ReviewCourseParamsSchema),
  reviewController.getMyReview,
)
reviewRouter.post(
  '/',
  requireAuth,
  requirePermission,
  validateBody(CreateReviewBodySchema),
  reviewController.createReview,
)
reviewRouter.put(
  '/:reviewId',
  requireAuth,
  requirePermission,
  validateParams(ReviewParamsSchema),
  validateBody(UpdateReviewBodySchema),
  reviewController.updateReview,
)
reviewRouter.delete(
  '/:reviewId',
  requireAuth,
  requirePermission,
  validateParams(ReviewParamsSchema),
  reviewController.deleteReview,
)

export default reviewRouter
