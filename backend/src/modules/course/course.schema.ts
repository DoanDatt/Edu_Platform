import z from 'zod'
import { PaginationQuerySchema } from '../../utils/pagination'
import { CourseLevel, CourseStatus } from '../../generated/prisma/enums'

export const CourseParamsSchema = z
  .object({
    courseId: z.coerce.number().int().positive(),
  })
  .strict()

export type CourseParamsType = z.infer<typeof CourseParamsSchema>

// ?page=1&limit=10&status=DRAFT -> phân trang + lọc theo trạng thái (không bắt buộc)

export const GetMyCoursesQuerySchema = PaginationQuerySchema.extend({
  status: z.enum(CourseStatus).optional(),
}).strict()

export type GetMyCoursesQueryType = z.infer<typeof GetMyCoursesQuerySchema>

export const CreateCourseBodySchema = z
  .object({
    title: z.string().trim().min(1, 'Vui lòng nhập tên khoá học').max(300),
    subtitle: z.string().trim().max(500).optional(),
    description: z.string().trim().max(20000).optional(),
    // Tạm thời nhận URL ảnh có sẵn; phần upload ảnh làm sau
    thumbnail: z.url('Ảnh bìa phải là một đường dẫn hợp lệ').max(1000).optional(),
    // VND, số nguyên. 0 = miễn phí
    price: z.number().int().min(0, 'Giá không được âm').max(100_000_000),
    level: z.enum(CourseLevel).optional(),
    language: z.string().trim().min(2).max(10).optional(),
    categoryId: z.number().int().positive(),
  })
  .strict()
export type CreateCourseBodyType = z.infer<typeof CreateCourseBodySchema>
export const UpdateCourseBodySchema = CreateCourseBodySchema
export type UpdateCourseBodyType = z.infer<typeof UpdateCourseBodySchema>

// ----- Luồng duyệt -----

export const GetPendingCoursesQuerySchema = PaginationQuerySchema

export type GetPendingCoursesQueryType = z.infer<typeof GetPendingCoursesQuerySchema>

export const RejectCourseBodySchema = z
  .object({
    reason: z.string().trim().min(1, 'Vui lòng nhập lý do từ chối').max(1000),
  })
  .strict()

export type RejectCourseBodyType = z.infer<typeof RejectCourseBodySchema>
