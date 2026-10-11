import { Request, Response } from 'express'
import * as reviewService from './review.service'
import {
  CreateReviewBodyType,
  GetReviewsQueryType,
  ReviewCourseParamsType,
  ReviewParamsType,
  UpdateReviewBodyType,
} from './review.schema'

export const getReviews = async (req: Request, res: Response) => {
  const query = req.query as unknown as GetReviewsQueryType
  const result = await reviewService.getReviews(query)
  res.json({ message: 'Lấy danh sách đánh giá thành công', ...result })
}

export const getMyReview = async (req: Request, res: Response) => {
  const { courseId } = req.params as unknown as ReviewCourseParamsType
  const review = await reviewService.getMyReview(req.user!.userId, courseId)
  res.json({ message: 'Lấy đánh giá của bạn thành công', data: review })
}

export const createReview = async (req: Request, res: Response) => {
  const body = req.body as CreateReviewBodyType
  const review = await reviewService.createReview(body, req.user!.userId)
  res.status(201).json({ message: 'Đánh giá thành công', data: review })
}

export const updateReview = async (req: Request, res: Response) => {
  const { reviewId } = req.params as unknown as ReviewParamsType
  const body = req.body as UpdateReviewBodyType
  const review = await reviewService.updateReview(reviewId, body, req.user!.userId)
  res.json({ message: 'Cập nhật đánh giá thành công', data: review })
}

export const deleteReview = async (req: Request, res: Response) => {
  const { reviewId } = req.params as unknown as ReviewParamsType
  await reviewService.deleteReview(reviewId, req.user!)
  res.json({ message: 'Xóa đánh giá thành công' })
}
