import z from 'zod'

export const LectureParamsSchema = z
  .object({
    lectureId: z.coerce.number().int().positive(),
  })
  .strict()

export type LectureParamsType = z.infer<typeof LectureParamsSchema>

// Các field nội dung, dùng chung cho tạo và sửa
const LectureContentSchema = z.object({
  title: z.string().trim().min(1, 'Vui lòng nhập tên bài giảng').max(300),
  // Tạm thời là link video có sẵn; phần upload làm sau
  videoUrl: z.url('Video phải là một đường dẫn hợp lệ').max(1000).optional(),
  content: z.string().trim().max(50000).optional(),
  // Thời lượng tính bằng giây (tối đa 24 giờ)
  durationSec: z.number().int().min(0).max(86400).optional(),
  isPreview: z.boolean().optional(),
})

export const CreateLectureBodySchema = LectureContentSchema.extend({
  // Bài giảng thuộc chương nào
  sectionId: z.number().int().positive(),
}).strict()

export type CreateLectureBodyType = z.infer<typeof CreateLectureBodySchema>

// Sửa: không đổi được chương (muốn chuyển chương thì xóa rồi tạo lại)
export const UpdateLectureBodySchema = LectureContentSchema.extend({
  position: z.number().int().min(0).optional(),
}).strict()

export type UpdateLectureBodyType = z.infer<typeof UpdateLectureBodySchema>
