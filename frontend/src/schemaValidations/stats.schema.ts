import { CourseStatus } from '@/constants/type'
import z from 'zod'

// 1 khóa trong danh sách khóa nổi bật (nhiều học viên nhất)
const TopCourseSchema = z.object({
  id: z.number(),
  title: z.string(),
  status: z.enum(CourseStatus),
  studentCount: z.number(),
  reviewCount: z.number()
})
export const InstructorStatsSchema = z.object({
  courses: z.object({
    total: z.number(),
    byStatus: z.object({
      DRAFT: z.number(),
      PENDING: z.number(),
      PUBLISHED: z.number(),
      REJECTED: z.number()
    })
  }),
  totalStudents: z.number(),
  reviews: z.object({
    total: z.number(),
    averageRating: z.number()
  }),
  topCourses: z.array(TopCourseSchema)
})
export type InstructorStatsType = z.infer<typeof InstructorStatsSchema>

export const InstructorStatsRes = z.object({
  message: z.string(),
  data: InstructorStatsSchema
})

export type InstructorStatsResType = z.infer<typeof InstructorStatsRes>

// ===== Admin: GET /stats/admin =====

export const AdminStatsSchema = z.object({
  users: z.object({
    total: z.number(),
    blocked: z.number(),
    newLast30Days: z.number(),
    // { ADMIN: 1, INSTRUCTOR: 2, STUDENT: 10 }: tên role → số người. Key là tên role nên dùng record
    byRole: z.record(z.string(), z.number())
  }),
  courses: z.object({
    total: z.number(),
    byStatus: z.object({
      DRAFT: z.number(),
      PENDING: z.number(),
      PUBLISHED: z.number(),
      REJECTED: z.number()
    })
  }),
  enrollments: z.object({
    total: z.number(),
    newLast30Days: z.number()
  }),
  reviews: z.object({
    total: z.number(),
    averageRating: z.number()
  })
})
export type AdminStatsType = z.infer<typeof AdminStatsSchema>

export const AdminStatsRes = z.object({
  message: z.string(),
  data: AdminStatsSchema
})
export type AdminStatsResType = z.infer<typeof AdminStatsRes>
