import z from 'zod'
import { PaginationQuerySchema } from '../../utils/pagination'

export const ReviewParamsSchema = z
  .object({
    reviewId: z.coerce.number().int().positive(),
  })
  .strict()

export type ReviewParamsType = z.infer<typeof ReviewParamsSchema>

// /reviews/mine/:courseId → đánh giá của tôi cho một khóa
export const ReviewCourseParamsSchema = z
  .object({
    courseId: z.coerce.number().int().positive(),
  })
  .strict()

export type ReviewCourseParamsType = z.infer<typeof ReviewCourseParamsSchema>

// GET /reviews?courseId=5&page=1&limit=10 → courseId bắt buộc
export const GetReviewsQuerySchema = PaginationQuerySchema.extend({
  courseId: z.coerce.number().int().positive(),
}).strict()

export type GetReviewsQueryType = z.infer<typeof GetReviewsQuerySchema>

const ReviewContentSchema = z.object({
  rating: z.number().int().min(1, 'Số sao từ 1 đến 5').max(5, 'Số sao từ 1 đến 5'),
  comment: z.string().trim().max(2000).optional(),
})

export const CreateReviewBodySchema = ReviewContentSchema.extend({
  courseId: z.number().int().positive(),
}).strict()

export type CreateReviewBodyType = z.infer<typeof CreateReviewBodySchema>

export const UpdateReviewBodySchema = ReviewContentSchema.strict()

export type UpdateReviewBodyType = z.infer<typeof UpdateReviewBodySchema>
