import { CourseLevel, CourseStatus } from '@/constants/type'
import z from 'zod'
import { PaginationQuery, PaginationRes } from './common.schema'
import { InstructorSectionSchema, PublicSectionSchema } from './section.schema'
import { EnrollmentProgressSchema } from './enrollment.schema'
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
  // Số bài giảng (thẻ khóa học: "12 bài học")
  totalLectures: z.number(),
  rating: z.object({
    averageRating: z.number(),
    totalReviews: z.number()
  })
})

export type PublicCourseType = z.infer<typeof PublicCourseSchema>

// Bộ lọc nhiều lựa chọn (checkbox ở cột lọc) giữ dạng chuỗi "1,2" như trên URL, gửi thẳng cho backend
const idList = z.string().regex(/^\d+(,\d+)*$/)
const LEVEL = Object.values(CourseLevel).join('|')
const levelList = z.string().regex(new RegExp(`^(${LEVEL})(,(${LEVEL}))*$`))

export const GetCoursesQuery = PaginationQuery.extend({
  search: z.string().trim().max(200).optional(),
  level: levelList.optional(),
  categoryId: idList.optional(),
  instructorId: idList.optional(),
  // Mức sao: điểm trung bình làm tròn, vd "5,4"
  rating: z.string().regex(/^[1-5](,[1-5])*$/).optional(),
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
    isEnrolled: z.boolean().nullable(),
    // Tab Instructor: số khóa đã xuất bản + tổng lượt ghi danh của giảng viên
    instructor: z.object({
      id: z.number(),
      name: z.string(),
      avatar: z.string().nullable(),
      courseCount: z.number(),
      studentCount: z.number()
    })
  }),
  message: z.string()
})

export type PublicCourseDetailResType = z.infer<typeof PublicCourseDetailRes>

// GET /courses/filters: lựa chọn + số khóa cho cột lọc của trang danh sách
export const CourseFiltersRes = z.object({
  data: z.object({
    categories: z.array(z.object({ id: z.number(), name: z.string(), count: z.number() })),
    instructors: z.array(z.object({ id: z.number(), name: z.string(), count: z.number() })),
    price: z.object({ all: z.number(), free: z.number(), paid: z.number() }),
    ratings: z.array(z.object({ stars: z.number(), count: z.number() })),
    levels: z.array(z.object({ level: z.enum(CourseLevel), count: z.number() }))
  }),
  message: z.string()
})

export type CourseFiltersResType = z.infer<typeof CourseFiltersRes>
export type CourseFiltersType = CourseFiltersResType['data']

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
    // { error }: ô giá để trống (undefined) → hiện câu này thay vì "expected number, received undefined"
    price: z.number({ error: 'Vui lòng nhập giá (0 = miễn phí)' }).int().min(0, 'Giá không được âm').max(100_000_000),
    level: z.enum(CourseLevel).optional(),
    language: z.string().trim().min(2).max(10).optional(),
    categoryId: z.number({ error: 'Vui lòng chọn danh mục' }).int().positive()
  })
  .strict()
export type CreateCourseBodyType = z.infer<typeof CreateCourseBodySchema>

// POST /courses, PUT /courses/:id → khóa vừa tạo / sửa (không kèm mục lục)
export const InstructorCourseRes = z.object({
  message: z.string(),
  data: InstructorCourseSchema
})
export type InstructorCourseResType = z.infer<typeof InstructorCourseRes>

// GET /courses/mine/:id → khóa + mục lục ĐẦY ĐỦ (chương, bài, cả bài không cho xem thử) để soạn bài
export const InstructorCourseDetailSchema = InstructorCourseSchema.extend({
  sections: z.array(InstructorSectionSchema)
})
export type InstructorCourseDetailType = z.infer<typeof InstructorCourseDetailSchema>

export const InstructorCourseDetailRes = z.object({
  message: z.string(),
  data: InstructorCourseDetailSchema
})
export type InstructorCourseDetailResType = z.infer<typeof InstructorCourseDetailRes>

export const UpdateCourseBodySchema = CreateCourseBodySchema
export type UpdateCourseBodyType = z.infer<typeof UpdateCourseBodySchema>

// ===== Giảng viên: học viên của khóa mình (GET /courses/mine/:id/students) =====

export const GetCourseStudentsQuery = PaginationQuery
export type GetCourseStudentsQueryType = z.infer<typeof GetCourseStudentsQuery>

// 1 học viên + tiến độ học khóa này (backend tính sẵn percent, giống "Khóa học của tôi")
export const CourseStudentSchema = z.object({
  enrolledAt: z.string(),
  user: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    avatar: z.string().nullable()
  }),
  progress: EnrollmentProgressSchema
})
export type CourseStudentType = z.infer<typeof CourseStudentSchema>

export const CourseStudentListRes = PaginationRes.extend({
  data: z.array(CourseStudentSchema),
  message: z.string()
})
export type CourseStudentListResType = z.infer<typeof CourseStudentListRes>

// ===== Admin: tất cả khóa học + duyệt =====

// ?search=react&status=PENDING&page=1 (backend còn lọc instructorId, categoryId; giao diện chưa dùng)
export const GetAdminCoursesQuery = PaginationQuery.extend({
  search: z.string().trim().max(200).optional(),
  status: z.enum(CourseStatus).optional()
}).strict()
export type GetAdminCoursesQueryType = z.infer<typeof GetAdminCoursesQuery>

// Giống khóa của giảng viên + biết của AI (admin cần) và bao nhiêu học viên
const AdminInstructorSchema = z.object({ id: z.number(), name: z.string(), email: z.string() })

export const AdminCourseSchema = InstructorCourseSchema.extend({
  instructor: AdminInstructorSchema,
  studentCount: z.number()
})
export type AdminCourseType = z.infer<typeof AdminCourseSchema>

export const AdminCourseListRes = PaginationRes.extend({
  data: z.array(AdminCourseSchema),
  message: z.string()
})
export type AdminCourseListResType = z.infer<typeof AdminCourseListRes>

// GET /courses/admin/:id → khóa ở MỌI trạng thái + mục lục đầy đủ (cả link video) để admin xem trước khi duyệt
export const AdminCourseDetailSchema = InstructorCourseDetailSchema.extend({
  instructor: AdminInstructorSchema
})
export type AdminCourseDetailType = z.infer<typeof AdminCourseDetailSchema>

export const AdminCourseDetailRes = z.object({
  message: z.string(),
  data: AdminCourseDetailSchema
})
export type AdminCourseDetailResType = z.infer<typeof AdminCourseDetailRes>

// Từ chối (PENDING → REJECTED) và gỡ khóa (PUBLISHED → REJECTED) cùng 1 body: bắt buộc lý do
// để giảng viên biết mà sửa (copy từ backend RejectCourseBodySchema)
export const RejectCourseBody = z
  .object({
    reason: z.string().trim().min(1, 'Vui lòng nhập lý do').max(1000)
  })
  .strict()
export type RejectCourseBodyType = z.infer<typeof RejectCourseBody>
