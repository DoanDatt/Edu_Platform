import z from 'zod'
import { CourseLevel, CourseStatus } from '@/constants/type'
import { CategorySchema } from './category.schema'
import { PaginationQuery, PaginationRes } from './common.schema'
import { RatingSchema, RatingSummarySchema } from './review.schema'
import { PublicSectionSchema, SectionWithLecturesSchema } from './section.schema'

// ===== Mảnh dùng chung =====
const CategoryRef = CategorySchema.pick({ id: true, name: true })
const InstructorContact = z.object({ id: z.number(), name: z.string(), email: z.string() })

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

// ===== Giảng viên =====

// Khóa học đầy đủ (giảng viên / admin xem)
export const CourseSchema = z.object({
  id: z.number(),
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
  thumbnail: z.string().nullable(),
  price: z.number(),
  level: z.enum(CourseLevel),
  language: z.string(),
  status: z.enum(CourseStatus),
  rejectReason: z.string().nullable(),
  publishedAt: z.string().nullable(),
  instructorId: z.number(),
  categoryId: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  category: CategoryRef
})
export type CourseType = z.infer<typeof CourseSchema>

// GET /courses/mine?page&limit&status
export const GetMyCoursesQuery = PaginationQuery.extend({
  status: z.enum(CourseStatus).optional()
}).strict()
export type GetMyCoursesQueryType = z.infer<typeof GetMyCoursesQuery>

export const MyCourseListRes = PaginationRes.extend({
  data: z.array(CourseSchema),
  message: z.string()
})
export type MyCourseListResType = z.infer<typeof MyCourseListRes>

// GET /courses/mine/:id: kèm mục lục đầy đủ để soạn bài
export const MyCourseDetailRes = z.object({
  data: CourseSchema.extend({ sections: z.array(SectionWithLecturesSchema) }),
  message: z.string()
})
export type MyCourseDetailResType = z.infer<typeof MyCourseDetailRes>

// POST /courses, PUT /courses/:id
export const CreateCourseBody = z
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
export type CreateCourseBodyType = z.infer<typeof CreateCourseBody>

export const UpdateCourseBody = CreateCourseBody
export type UpdateCourseBodyType = z.infer<typeof UpdateCourseBody>

// POST, PUT, submit, approve, reject đều trả 1 khóa học
export const CourseRes = z.object({ data: CourseSchema, message: z.string() })
export type CourseResType = z.infer<typeof CourseRes>

// DELETE /courses/:id → dùng MessageRes trong common.schema

// ===== Admin duyệt =====

// GET /courses/pending?page&limit
export const GetPendingCoursesQuery = PaginationQuery
export type GetPendingCoursesQueryType = z.infer<typeof GetPendingCoursesQuery>

export const PendingCourseListRes = PaginationRes.extend({
  data: z.array(CourseSchema.extend({ instructor: InstructorContact })),
  message: z.string()
})
export type PendingCourseListResType = z.infer<typeof PendingCourseListRes>

// GET /courses/admin/:id
export const AdminCourseDetailRes = z.object({
  data: CourseSchema.extend({
    sections: z.array(SectionWithLecturesSchema),
    instructor: InstructorContact
  }),
  message: z.string()
})
export type AdminCourseDetailResType = z.infer<typeof AdminCourseDetailRes>

// POST /courses/:id/reject
export const RejectCourseBody = z
  .object({
    reason: z.string().trim().min(1, 'Vui lòng nhập lý do từ chối').max(1000)
  })
  .strict()
export type RejectCourseBodyType = z.infer<typeof RejectCourseBody>
