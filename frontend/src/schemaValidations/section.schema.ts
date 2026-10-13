import z from 'zod'
import { LectureSchema, PublicLectureSchema } from './lecture.schema'

// Chương (POST / PUT /sections trả về dạng này, không kèm bài giảng)
export const SectionSchema = z.object({
  id: z.number(),
  title: z.string(),
  position: z.number(),
  courseId: z.number(),
  createdAt: z.string(),
  updatedAt: z.string()
})
export type SectionType = z.infer<typeof SectionSchema>

// Chương kèm bài giảng đầy đủ: chi tiết khóa của giảng viên / admin
export const SectionWithLecturesSchema = SectionSchema.extend({
  lectures: z.array(LectureSchema)
})
export type SectionWithLecturesType = z.infer<typeof SectionWithLecturesSchema>

// Chương trong mục lục công khai: chỉ id, title và bài giảng rút gọn
export const PublicSectionSchema = z.object({
  id: z.number(),
  title: z.string(),
  lectures: z.array(PublicLectureSchema)
})
export type PublicSectionType = z.infer<typeof PublicSectionSchema>

// POST /sections, PUT /sections/:id
export const SectionRes = z.object({
  data: SectionSchema,
  message: z.string()
})
export type SectionResType = z.infer<typeof SectionRes>

// Copy từ backend
// POST /sections: khóa phải là của mình và đang DRAFT / REJECTED
export const CreateSectionBody = z
  .object({
    courseId: z.number().int().positive(),
    title: z.string().trim().min(1, 'Vui lòng nhập tên chương').max(300)
  })
  .strict()
export type CreateSectionBodyType = z.infer<typeof CreateSectionBody>

// PUT /sections/:id: gửi position mới để đổi thứ tự (không gửi thì giữ nguyên)
export const UpdateSectionBody = z
  .object({
    title: z.string().trim().min(1, 'Vui lòng nhập tên chương').max(300),
    position: z.number().int().min(0).optional()
  })
  .strict()
export type UpdateSectionBodyType = z.infer<typeof UpdateSectionBody>

// DELETE /sections/:id → dùng MessageRes (xóa luôn các bài giảng trong chương)
