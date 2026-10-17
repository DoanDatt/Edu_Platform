import z from 'zod'
import { CourseLevel } from '@/constants/type'
import { CategorySchema } from './category.schema'
import { PaginationQuery, PaginationRes } from './common.schema'
import { RatingSchema, RatingSummarySchema } from './review.schema'
import { PublicSectionSchema } from './section.schema'

// Hiện chỉ có phần CÔNG KHAI (trang /courses, /courses/[slug]).
// Phần giảng viên / admin (khóa của tôi, tạo / sửa, duyệt...) thêm vào khi làm Mốc 4, 5

// ===== Mảnh dùng chung =====
const CategoryRef = CategorySchema.pick({ id: true, name: true })

// ===== Công khai =====

// GET /courses?search&categoryId&level&price&sort&page&limit
export const GetCoursesQuery = PaginationQuery.extend({
  search: z.string().trim().max(200).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  level: z.enum(CourseLevel).optional(),
  price: z.enum(['free', 'paid']).optional(),
  sort: z.enum(['newest', 'popular', 'price_asc', 'price_desc']).default('newest')
}).strict()
export type GetCoursesQueryType = z.infer<typeof GetCoursesQuery>

// Một khóa trong danh sách công khai
export const PublicCourseSchema = z.object({
  id: z.number(),
  title: z.string(),
  subtitle: z.string(),
  thumbnail: z.string().nullable(),
  price: z.number(),
  level: z.enum(CourseLevel),
  language: z.string(),
  publishedAt: z.string(), // ISO date, JSON không có kiểu Date
  category: CategoryRef,
  instructor: z.object({ id: z.number(), name: z.string(), avatar: z.string().nullable() }),
  studentCount: z.number(),
  rating: RatingSchema
})
export type PublicCourseType = z.infer<typeof PublicCourseSchema>

export const PublicCourseListRes = PaginationRes.extend({
  data: z.array(PublicCourseSchema),
  message: z.string()
})
export type PublicCourseListResType = z.infer<typeof PublicCourseListRes>

// GET /courses/:id: trang chi tiết
export const PublicCourseDetailRes = z.object({
  data: PublicCourseSchema.extend({
    description: z.string(),
    sections: z.array(PublicSectionSchema),
    totalLectures: z.number(),
    totalDurationSec: z.number(),
    rating: RatingSummarySchema,
    isEnrolled: z.boolean().nullable() // null = khách chưa đăng nhập
  }),
  message: z.string()
})
export type PublicCourseDetailResType = z.infer<typeof PublicCourseDetailRes>
