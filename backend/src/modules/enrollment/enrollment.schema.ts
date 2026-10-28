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

// PUT /lectures/:lectureId/watch: trình phát video báo đã xem bao lâu
export const ReportWatchBodySchema = z
  .object({
    // Số giây video thực sự phát kể từ lần báo trước (frontend báo ~15 giây / lần nên 600 là dư)
    playedSec: z.number().min(0).max(600),
    // Đang dừng ở giây thứ mấy (tối đa 24 giờ)
    positionSec: z.number().min(0).max(86400),
  })
  .strict()
  .transform(({ playedSec, positionSec }) => ({
    playedSec: Math.floor(playedSec),
    positionSec: Math.floor(positionSec),
  }))

export type ReportWatchBodyType = z.infer<typeof ReportWatchBodySchema>
