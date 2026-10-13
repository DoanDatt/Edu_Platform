import z from 'zod'
import { CourseLevel } from '@/constants/type'
import { PaginationQuery, PaginationRes } from './common.schema'
import { LectureSchema } from './lecture.schema'

// Tiến độ học của một khóa
export const ProgressSchema = z.object({
  totalLectures: z.number(),
  completedLectures: z.number(),
  percent: z.number() // 0–100, làm tròn
})
export type ProgressType = z.infer<typeof ProgressSchema>

const InstructorName = z.object({ id: z.number(), name: z.string() })

// POST /enrollments: ghi danh
export const CreateEnrollmentBody = z
  .object({
    courseId: z.number().int().positive()
  })
  .strict()
export type CreateEnrollmentBodyType = z.infer<typeof CreateEnrollmentBody>

// 409 nếu đã ghi danh / là giảng viên của khóa, 402 nếu khóa có phí
export const EnrollmentRes = z.object({
  data: z.object({
    id: z.number(),
    userId: z.number(),
    courseId: z.number(),
    createdAt: z.string()
  }),
  message: z.string()
})
export type EnrollmentResType = z.infer<typeof EnrollmentRes>

// GET /enrollments/mine?page&limit: trang "Khóa học của tôi"
export const GetMyEnrollmentsQuery = PaginationQuery
export type GetMyEnrollmentsQueryType = z.infer<typeof GetMyEnrollmentsQuery>

export const MyEnrollmentSchema = z.object({
  enrolledAt: z.string(),
  course: z.object({
    id: z.number(),
    title: z.string(),
    subtitle: z.string(),
    thumbnail: z.string().nullable(),
    level: z.enum(CourseLevel),
    instructor: InstructorName
  }),
  progress: ProgressSchema
})
export type MyEnrollmentType = z.infer<typeof MyEnrollmentSchema>

export const MyEnrollmentListRes = PaginationRes.extend({
  data: z.array(MyEnrollmentSchema),
  message: z.string()
})
export type MyEnrollmentListResType = z.infer<typeof MyEnrollmentListRes>

// GET /enrollments/mine/:courseId: trang học (mục lục + bài nào đã xong)
// Nội dung bài (videoUrl, content) lấy riêng qua GET /lectures/:id
export const LearningLectureSchema = LectureSchema.pick({
  id: true,
  title: true,
  durationSec: true,
  isPreview: true
}).extend({
  completed: z.boolean() // hiện dấu ✓ trong mục lục
})
export type LearningLectureType = z.infer<typeof LearningLectureSchema>

export const LearningRes = z.object({
  data: z.object({
    enrolledAt: z.string(),
    course: z.object({
      id: z.number(),
      title: z.string(),
      subtitle: z.string(),
      thumbnail: z.string().nullable(),
      instructor: InstructorName,
      sections: z.array(
        z.object({
          id: z.number(),
          title: z.string(),
          lectures: z.array(LearningLectureSchema)
        })
      )
    }),
    progress: ProgressSchema
  }),
  message: z.string()
})
export type LearningResType = z.infer<typeof LearningRes>
