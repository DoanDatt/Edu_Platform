import z from 'zod'
import { CourseStatus } from '@/constants/type'

// Tầng nhỏ nhất: file này KHÔNG import section / course để tránh import vòng tròn

// Bài giảng đầy đủ (giảng viên / admin, hoặc người được phép mở bài)
export const LectureSchema = z.object({
  id: z.number(),
  title: z.string(),
  videoUrl: z.string().nullable(),
  content: z.string(),
  durationSec: z.number(),
  isPreview: z.boolean(),
  position: z.number(),
  sectionId: z.number(),
  createdAt: z.string(),
  updatedAt: z.string()
})
export type LectureType = z.infer<typeof LectureSchema>

// Bài giảng trong mục lục công khai: không có content
export const PublicLectureSchema = LectureSchema.pick({
  id: true,
  title: true,
  durationSec: true,
  isPreview: true,
  videoUrl: true // null nếu không phải bài xem thử
})
export type PublicLectureType = z.infer<typeof PublicLectureSchema>

// GET /lectures/:id: trang học, kèm chương + khóa để hiện breadcrumb
export const LectureDetailRes = z.object({
  data: LectureSchema.extend({
    section: z.object({
      id: z.number(),
      title: z.string(),
      course: z.object({
        id: z.number(),
        title: z.string(),
        status: z.enum(CourseStatus),
        instructorId: z.number()
      })
    })
  }),
  message: z.string()
})
export type LectureDetailResType = z.infer<typeof LectureDetailRes>

// POST /lectures, PUT /lectures/:id
export const LectureRes = z.object({
  data: LectureSchema,
  message: z.string()
})
export type LectureResType = z.infer<typeof LectureRes>

// POST / DELETE /lectures/:id/complete: đánh dấu / bỏ đánh dấu đã học
export const LectureCompletionRes = z.object({
  data: z.object({
    lectureId: z.number(),
    completed: z.boolean()
  }),
  message: z.string()
})
export type LectureCompletionResType = z.infer<typeof LectureCompletionRes>

// Copy từ backend: phần chung của tạo và sửa
const LectureContent = z.object({
  title: z.string().trim().min(1, 'Vui lòng nhập tên bài giảng').max(300),
  videoUrl: z.url('Video phải là một đường dẫn hợp lệ').max(1000).optional(),
  content: z.string().trim().max(50000).optional(),
  durationSec: z.number().int().min(0).max(86400).optional(),
  isPreview: z.boolean().optional()
})

// POST /lectures
export const CreateLectureBody = LectureContent.extend({
  sectionId: z.number().int().positive()
}).strict()
export type CreateLectureBodyType = z.infer<typeof CreateLectureBody>

// PUT /lectures/:id: không đổi được chương (muốn chuyển chương thì xóa rồi tạo lại)
export const UpdateLectureBody = LectureContent.extend({
  position: z.number().int().min(0).optional()
}).strict()
export type UpdateLectureBodyType = z.infer<typeof UpdateLectureBody>

// DELETE /lectures/:id → dùng MessageRes trong common.schema
