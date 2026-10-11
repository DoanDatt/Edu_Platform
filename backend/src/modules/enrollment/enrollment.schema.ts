import z from 'zod'
import { PaginationQuerySchema } from '../../utils/pagination'

export const CreateEnrollmentBodySchema = z
  .object({
    courseId: z.number().int().positive(),
  })
  .strict()

export type CreateEnrollmentBodyType = z.infer<typeof CreateEnrollmentBodySchema>

export const GetMyEnrollmentsQuerySchema = PaginationQuerySchema

export type GetMyEnrollmentsQueryType = z.infer<typeof GetMyEnrollmentsQuerySchema>

// /enrollments/mine/:courseId → trang học của một khóa
export const EnrollmentCourseParamsSchema = z
  .object({
    courseId: z.coerce.number().int().positive(),
  })
  .strict()

export type EnrollmentCourseParamsType = z.infer<typeof EnrollmentCourseParamsSchema>
