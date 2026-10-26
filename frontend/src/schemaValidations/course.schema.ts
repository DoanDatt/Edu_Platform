import { CourseLevel, CourseStatus } from '@/constants/type'
import z from 'zod'
import { PaginationQuery, PaginationRes } from './common.schema'
import { PublicSectionSchema } from './section.schema'
import { RatingSummarySchema } from './review.schema'

// Public Course
export const PublicCourseSchema = z.object({
  id: z.number(),
  title: z.string(),
  subtitle: z.string(),
  thumbnail: z.string().nullable(),
  price: z.number(),
  level: z.enum(CourseLevel),
  language: z.string(),
  publishedAt: z.string(),
  category: z.object({
    id: z.number(),
    name: z.string()
  }),
  instructor: z.object({
    id: z.number(),
    name: z.string(),
    avatar: z.string().nullable()
  }),
  studentCount: z.number(),
  rating: z.object({
    averageRating: z.number(),
    totalReviews: z.number()
  })
})

export type PublicCourseType = z.infer<typeof PublicCourseSchema>

export const GetCoursesQuery = PaginationQuery.extend({
  search: z.string().trim().max(200).optional(),
  level: z.enum(CourseLevel).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  price: z.enum(['free', 'paid']).optional(),
  sort: z.enum(['newest', 'popular', 'price_asc', 'price_desc']).default('newest')
}).strict()

export type GetCoursesQueryType = z.infer<typeof GetCoursesQuery>

export const PublicCourseListRes = PaginationRes.extend({
  data: z.array(PublicCourseSchema),
  message: z.string()
})

export type PublicCourseListResType = z.infer<typeof PublicCourseListRes>

export const PublicCourseDetailRes = z.object({
  data: PublicCourseSchema.extend({
    description: z.string(),
    sections: z.array(PublicSectionSchema),
    totalLectures: z.number(),
    totalDurationSec: z.number(),
    rating: RatingSummarySchema,
    isEnrolled: z.boolean().nullable()
  }),
  message: z.string()
})

export type PublicCourseDetailResType = z.infer<typeof PublicCourseDetailRes>

export const InstructorCourseSchema = z.object({
  id: z.number(),
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
  thumbnail: z.string().nullable(),
  price: z.number(),
  level: z.enum(CourseLevel),
  language: z.string(),
  status: z.enum(CourseStatus),
  updatedAt: z.string(),
  rejectReason: z.string().nullable(),
  category: z.object({
    id: z.number(),
    name: z.string()
  })
})
export type InstructorCourseType = z.infer<typeof InstructorCourseSchema>

export const InstructorCourseListRes = PaginationRes.extend({
  data: z.array(InstructorCourseSchema),
  message: z.string()
})

export type InstructorCourseListResType = z.infer<typeof InstructorCourseListRes>

export const GetMyCoursesQuery = PaginationQuery.extend({
  status: z.enum(CourseStatus).optional()
}).strict()

export type GetMyCoursesQueryType = z.infer<typeof GetMyCoursesQuery>

export const CreateCourseBodySchema = z
  .object({
    title: z.string().trim().min(1, 'Vui lòng nhập tên khoá học').max(300),
    subtitle: z.string().trim().max(500).optional(),
    description: z.string().trim().max(20000).optional(),
    thumbnail: z.url('Ảnh bìa phải là một đường dẫn hợp lệ').max(1000).optional(),
    price: z.number().int().min(0, 'Giá không được âm').max(100_000_000),
    level: z.enum(CourseLevel).optional(),
    language: z.string().trim().min(2).max(10).optional(),
    categoryId: z.number().int().positive()
  })
  .strict()
export type CreateCourseBodyType = z.infer<typeof CreateCourseBodySchema>

export const InstructorCourseDetailRes = z.object({
  message: z.string(),
  data: InstructorCourseSchema
})

export type InstructorCourseDetailResType = z.infer<typeof InstructorCourseDetailRes>

export const UpdateCourseBodySchema = CreateCourseBodySchema
export type UpdateCourseBodyType = z.infer<typeof UpdateCourseBodySchema>
