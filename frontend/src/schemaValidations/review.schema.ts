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

export const GetReviewsQuery = PaginationQuery.extend({
  courseId: z.coerce.number()
})

export type GetReviewsQueryType = z.infer<typeof GetReviewsQuery>
