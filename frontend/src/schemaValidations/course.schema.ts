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
