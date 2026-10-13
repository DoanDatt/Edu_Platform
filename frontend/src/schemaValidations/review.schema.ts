import z from 'zod'
import { PaginationQuery, PaginationRes } from './common.schema'

// Điểm đánh giá rút gọn: thẻ khóa học trong danh sách
export const RatingSchema = z.object({
  averageRating: z.number(), // làm tròn 1 chữ số, chưa có đánh giá thì 0
  totalReviews: z.number()
})
export type RatingType = z.infer<typeof RatingSchema>

// Điểm đánh giá đầy đủ: trang chi tiết khóa + danh sách đánh giá
export const RatingSummarySchema = RatingSchema.extend({
  // số lượt theo từng mức sao: { "1": 0, "2": 0, "3": 0, "4": 1, "5": 1 }
  distribution: z.record(z.string(), z.number())
})
export type RatingSummaryType = z.infer<typeof RatingSummarySchema>

export const ReviewSchema = z.object({
  id: z.number(),
  rating: z.number(), // 1–5
  comment: z.string(), // không viết thì ""
  userId: z.number(),
  courseId: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  user: z.object({
    id: z.number(),
    name: z.string(),
    avatar: z.string().nullable()
  })
})
export type ReviewType = z.infer<typeof ReviewSchema>

// GET /reviews?courseId&page&limit: courseId bắt buộc
export const GetReviewsQuery = PaginationQuery.extend({
  courseId: z.coerce.number().int().positive()
}).strict()
export type GetReviewsQueryType = z.infer<typeof GetReviewsQuery>

export const ReviewListRes = PaginationRes.extend({
  data: z.array(ReviewSchema),
  summary: RatingSummarySchema,
  message: z.string()
})
export type ReviewListResType = z.infer<typeof ReviewListRes>

// GET /reviews/mine/:courseId: chưa đánh giá thì data là null
// → null: hiện form "Viết đánh giá", có dữ liệu: hiện form "Sửa đánh giá"
export const MyReviewRes = z.object({
  data: ReviewSchema.nullable(),
  message: z.string()
})
export type MyReviewResType = z.infer<typeof MyReviewRes>

// POST /reviews, PUT /reviews/:id
export const ReviewRes = z.object({
  data: ReviewSchema,
  message: z.string()
})
export type ReviewResType = z.infer<typeof ReviewRes>

// Copy từ backend
const ReviewContent = z.object({
  rating: z.number().int().min(1, 'Số sao từ 1 đến 5').max(5, 'Số sao từ 1 đến 5'),
  comment: z.string().trim().max(2000).optional()
})

// POST /reviews: phải ghi danh trước, mỗi khóa đánh giá 1 lần
export const CreateReviewBody = ReviewContent.extend({
  courseId: z.number().int().positive()
}).strict()
export type CreateReviewBodyType = z.infer<typeof CreateReviewBody>

// PUT /reviews/:id
export const UpdateReviewBody = ReviewContent.strict()
export type UpdateReviewBodyType = z.infer<typeof UpdateReviewBody>

// DELETE /reviews/:id → dùng MessageRes trong common.schema
