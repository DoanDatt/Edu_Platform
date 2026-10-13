import z from 'zod'

export const UpdateProfileBodySchema = z
  .object({
    name: z.string().trim().min(1, 'Vui lòng nhập tên').max(100),
    phoneNumber: z.string().trim().min(9, 'Số điện thoại không hợp lệ').max(15, 'Số điện thoại không hợp lệ'),
    // URL ảnh (lấy từ POST /uploads/image), gửi null để xóa avatar, không gửi thì giữ nguyên
    avatar: z.url('Avatar phải là một đường dẫn hợp lệ').max(1000).nullable().optional(),
  })
  .strict()

export type UpdateProfileBodyType = z.infer<typeof UpdateProfileBodySchema>

export const ChangePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại').max(100),
    newPassword: z.string().min(8, 'Mật khẩu tối thiểu 8 kí tự').max(100),
    confirmPassword: z.string(),
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
    path: ['newPassword'],
  })

export type ChangePasswordBodyType = z.infer<typeof ChangePasswordBodySchema>
