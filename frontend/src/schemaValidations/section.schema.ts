import z from 'zod'

export const PublicLectureSchema = z.object({
  id: z.number(),
  title: z.string(),
  durationSec: z.number(),
  isPreview: z.boolean(),
  videoUrl: z.string().nullable()
})

export type PublicLectureType = z.infer<typeof PublicLectureSchema>

export const PublicSectionSchema = z.object({
  id: z.number(),
  title: z.string(),
  lectures: z.array(PublicLectureSchema)
})
export type PublicSectionType = z.infer<typeof PublicSectionSchema>

// ===== Giảng viên soạn mục lục =====

// Bài giảng ĐẦY ĐỦ (giảng viên xem khóa của mình): có cả content, khác PublicLectureSchema
export const InstructorLectureSchema = PublicLectureSchema.extend({
  content: z.string()
})
export type InstructorLectureType = z.infer<typeof InstructorLectureSchema>

export const InstructorSectionSchema = z.object({
  id: z.number(),
  title: z.string(),
  lectures: z.array(InstructorLectureSchema)
})
export type InstructorSectionType = z.infer<typeof InstructorSectionSchema>

// Copy từ backend section.schema.ts
export const CreateSectionBody = z
  .object({
    courseId: z.number().int().positive(),
    title: z.string().trim().min(1, 'Vui lòng nhập tên chương').max(300)
  })
  .strict()
export type CreateSectionBodyType = z.infer<typeof CreateSectionBody>

// Đổi tên chương. Đổi thứ tự dùng ReorderSectionsBody (gửi cả danh sách) nên bỏ position
export const UpdateSectionBody = CreateSectionBody.pick({ title: true }).strict()
export type UpdateSectionBodyType = z.infer<typeof UpdateSectionBody>

// Gửi ĐỦ id các chương theo thứ tự mới
export const ReorderSectionsBody = z
  .object({
    courseId: z.number().int().positive(),
    sectionIds: z.array(z.number().int().positive()).min(1)
  })
  .strict()
export type ReorderSectionsBodyType = z.infer<typeof ReorderSectionsBody>

// POST /sections, PUT /sections/:id → chương vừa tạo / sửa (không kèm bài giảng)
export const SectionRes = z.object({
  message: z.string(),
  data: z.object({ id: z.number(), title: z.string() })
})
export type SectionResType = z.infer<typeof SectionRes>
