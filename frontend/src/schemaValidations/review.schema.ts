import z from 'zod'
import { PaginationQuery, PaginationRes } from './common.schema'

export const ReviewSchema = z.object({
  id: z.number(),
  rating: z.number(),
  comment: z.string(),
  courseId: z.number(),
  userId: z.number(),
  createdAt: z.string(),
  user: z.object({
    id: z.number(),
    name: z.string(),
    avatar: z.string().nullable()
  })
})

export type ReviewType = z.infer<typeof ReviewSchema>

export const RatingSummarySchema = z.object({
  averageRating: z.number(),
  totalReviews: z.number(),
  distribution: z.record(z.string(), z.number()) // object: key là chuỗi, giá trị là số
})
export type RatingSummaryType = z.infer<typeof RatingSummarySchema>

export const ReviewListRes = PaginationRes.extend({
  data: z.array(ReviewSchema),
  summary: RatingSummarySchema,
  message: z.string()
})
export type ReviewListResType = z.infer<typeof ReviewListRes>

// GET /reviews/featured: đánh giá nổi bật cho trang chủ (kèm tên khóa được đánh giá)
export const FeaturedReviewSchema = ReviewSchema.pick({
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  user: true
}).extend({
  course: z.object({ id: z.number(), title: z.string() })
})
export type FeaturedReviewType = z.infer<typeof FeaturedReviewSchema>

export const FeaturedReviewListRes = z.object({
  data: z.array(FeaturedReviewSchema),
  message: z.string()
})
export type FeaturedReviewListResType = z.infer<typeof FeaturedReviewListRes>

export const GetReviewsQuery = PaginationQuery.extend({
  courseId: z.coerce.number()
})

export type GetReviewsQueryType = z.infer<typeof GetReviewsQuery>

const ReviewContentSchema = z.object({
  rating: z.number().int().min(1, 'Số sao từ 1 đến 5').max(5, 'Số sao từ 1 đến 5'),
  comment: z.string().trim().max(2000).optional()
})

export const CreateReviewBodySchema = ReviewContentSchema.extend({
  courseId: z.number().int().positive()
}).strict()

export type CreateReviewBodyType = z.infer<typeof CreateReviewBodySchema>

export const UpdateReviewBodySchema = ReviewContentSchema.strict()

export type UpdateReviewBodyType = z.infer<typeof UpdateReviewBodySchema>

export const ReviewRes = z.object({
  data: ReviewSchema,
  message: z.string()
})
export type ReviewResType = z.infer<typeof ReviewRes>

export const MyReviewRes = z.object({
  data: ReviewSchema.nullable(),
  message: z.string()
})
export type MyReviewResType = z.infer<typeof MyReviewRes>
