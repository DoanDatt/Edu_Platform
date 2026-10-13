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

// ----- Công khai: danh sách khóa học đã xuất bản -----

// ?search=react&categoryId=2&level=BEGINNER&price=free&sort=popular&page=1&limit=12
// Mọi bộ lọc đều không bắt buộc: không gửi thì không lọc
export const GetCoursesQuerySchema = PaginationQuerySchema.extend({
  search: z.string().trim().max(200).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  level: z.enum(CourseLevel).optional(),
  price: z.enum(['free', 'paid']).optional(),
  // newest: mới xuất bản | popular: nhiều học viên | price_asc / price_desc: theo giá
  sort: z.enum(['newest', 'popular', 'price_asc', 'price_desc']).default('newest'),
}).strict()

export type GetCoursesQueryType = z.infer<typeof GetCoursesQuerySchema>

// ----- Luồng duyệt -----

export const GetPendingCoursesQuerySchema = PaginationQuerySchema

export type GetPendingCoursesQueryType = z.infer<typeof GetPendingCoursesQuerySchema>

export const RejectCourseBodySchema = z
  .object({
    reason: z.string().trim().min(1, 'Vui lòng nhập lý do từ chối').max(1000),
  })
  .strict()

export type RejectCourseBodyType = z.infer<typeof RejectCourseBodySchema>

// ----- Admin: tất cả khóa học -----

// ?search=react&status=PUBLISHED&instructorId=3&categoryId=1&page=1&limit=10
export const GetAdminCoursesQuerySchema = PaginationQuerySchema.extend({
  search: z.string().trim().max(200).optional(),
  status: z.enum(CourseStatus).optional(),
  instructorId: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
}).strict()

export type GetAdminCoursesQueryType = z.infer<typeof GetAdminCoursesQuerySchema>

// Gỡ khóa đã xuất bản: bắt buộc ghi lý do để giảng viên biết mà sửa
export const UnpublishCourseBodySchema = RejectCourseBodySchema

export type UnpublishCourseBodyType = z.infer<typeof UnpublishCourseBodySchema>

// ----- Giảng viên: học viên của khóa mình -----

export const GetCourseStudentsQuerySchema = PaginationQuerySchema

export type GetCourseStudentsQueryType = z.infer<typeof GetCourseStudentsQuerySchema>
