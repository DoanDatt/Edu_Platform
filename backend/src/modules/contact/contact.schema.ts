import z from 'zod'

// POST /contact: form "Contact Us" (tên, email, nội dung)
export const CreateContactBodySchema = z
  .object({
    name: z.string().trim().min(1, 'Vui lòng nhập tên').max(100),
    email: z.email('Email không hợp lệ').max(200),
    message: z.string().trim().min(1, 'Vui lòng nhập nội dung').max(5000, 'Nội dung tối đa 5000 ký tự'),
  })
  .strict()

export type CreateContactBodyType = z.infer<typeof CreateContactBodySchema>
