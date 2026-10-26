import z from 'zod'

export const LectureSchema = z.object({
  id: z.number(),
  title: z.string(),
  videoUrl: z.string().nullable(),
  content: z.string(),
  durationSec: z.number(),

  section: z.object({
    id: z.number(),
    title: z.string(),
    course: z.object({
      id: z.number(),
      title: z.string(),
      status: z.string(),
      instructorId: z.number()
    })
  })
})

export type LectureType = z.infer<typeof LectureSchema>

export const LectureResSchema = z.object({
  data: LectureSchema,
  message: z.string()
})

export type LectureResType = z.infer<typeof LectureResSchema>

export const LectureCompleteSchema = z.object({
  lectureId: z.number(),
  completed: z.boolean()
})
export type LectureCompleteType = z.infer<typeof LectureCompleteSchema>

export const LectureCompleteRes = z.object({
  data: LectureCompleteSchema,
  message: z.string()
})

export type LectureCompleteResType = z.infer<typeof LectureCompleteRes>

// ===== Giảng viên soạn bài (copy từ backend lecture.schema.ts) =====

// Các field nội dung, dùng chung cho tạo và sửa
export const LectureContentSchema = z.object({
  title: z.string().trim().min(1, 'Vui lòng nhập tên bài giảng').max(300),
  videoUrl: z.url('Video phải là một đường dẫn hợp lệ').max(1000).optional(),
  content: z.string().trim().max(50000).optional(),
  // Thời lượng tính bằng giây (tối đa 24 giờ)
  durationSec: z
    .number({ error: 'Vui lòng nhập thời lượng' })
    .int('Thời lượng phải là số giây nguyên')
    .min(0)
    .max(86400, 'Tối đa 24 giờ')
    .optional(),
  isPreview: z.boolean().optional()
})
export type LectureContentType = z.infer<typeof LectureContentSchema>

export const CreateLectureBody = LectureContentSchema.extend({
  sectionId: z.number().int().positive()
}).strict()
export type CreateLectureBodyType = z.infer<typeof CreateLectureBody>

// Backend cho chuyển chương (sectionId) và đổi vị trí (position) khi sửa; frontend chưa dùng 2 field này
export const UpdateLectureBody = LectureContentSchema.extend({
  sectionId: z.number().int().positive().optional()
}).strict()
export type UpdateLectureBodyType = z.infer<typeof UpdateLectureBody>

export const ReorderLecturesBody = z
  .object({
    sectionId: z.number().int().positive(),
    lectureIds: z.array(z.number().int().positive()).min(1)
  })
  .strict()
export type ReorderLecturesBodyType = z.infer<typeof ReorderLecturesBody>

// POST /lectures, PUT /lectures/:id → bài vừa tạo / sửa
export const InstructorLectureRes = z.object({
  message: z.string(),
  data: z.object({ id: z.number(), title: z.string() })
})
export type InstructorLectureResType = z.infer<typeof InstructorLectureRes>
