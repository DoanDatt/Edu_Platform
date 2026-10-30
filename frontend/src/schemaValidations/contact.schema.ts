import z from 'zod'

// Form trang Liên hệ (backend: POST /contact). Khớp giới hạn của backend
export const ContactBody = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên').max(100),
  email: z.email('Email không hợp lệ').max(200),
  message: z.string().trim().min(1, 'Vui lòng nhập nội dung').max(5000)
})
export type ContactBodyType = z.infer<typeof ContactBody>

export const ContactRes = z.object({
  data: z.object({ id: z.number(), createdAt: z.string() }),
  message: z.string()
})
export type ContactResType = z.infer<typeof ContactRes>
