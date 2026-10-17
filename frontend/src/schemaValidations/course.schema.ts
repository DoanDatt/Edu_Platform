import { CourseLevel } from '@/constants/type'
import z from 'zod'
import { PaginationQuery, PaginationRes } from './common.schema'

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
