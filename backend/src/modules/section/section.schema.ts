import z from 'zod'

export const SectionParamsSchema = z
  .object({
    sectionId: z.coerce.number().int().positive(),
  })
  .strict()

export type SectionParamsType = z.infer<typeof SectionParamsSchema>

export const CreateSectionBodySchema = z
  .object({
    // Chương thuộc khóa học nào (khóa phải là của mình và đang DRAFT/REJECTED)
    courseId: z.number().int().positive(),
    title: z.string().trim().min(1, 'Vui lòng nhập tên chương').max(300),
  })
  .strict()

export type CreateSectionBodyType = z.infer<typeof CreateSectionBodySchema>

export const UpdateSectionBodySchema = z
  .object({
    title: z.string().trim().min(1, 'Vui lòng nhập tên chương').max(300),
    // Đổi thứ tự: gửi vị trí mới (không gửi thì giữ nguyên)
    position: z.number().int().min(0).optional(),
  })
  .strict()

export type UpdateSectionBodyType = z.infer<typeof UpdateSectionBodySchema>
