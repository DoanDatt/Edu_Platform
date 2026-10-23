import { RoleValues } from '@/constants/type'
import z from 'zod'
import { RefreshTokenBodyRes } from './auth.schema'

// ===== Hồ sơ: GET /profile, PUT /profile =====

// Chỉ khai báo các trường trang hồ sơ dùng tới (JSON còn status, createdAt... → Zod bỏ qua)
export const ProfileSchema = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string(),
  phoneNumber: z.string(),
  avatar: z.string().nullable(), // chưa có ảnh → null
  role: z.object({
    id: z.number(),
    name: z.enum(RoleValues) // 'ADMIN' | 'INSTRUCTOR' | 'STUDENT' (giống auth.schema)
  })
})
export type ProfileType = z.infer<typeof ProfileSchema>

// Dùng chung cho GET /profile và PUT /profile: cả 2 trả { message, data: <hồ sơ> }
export const ProfileRes = z.object({
  data: ProfileSchema,
  message: z.string()
})
export type ProfileResType = z.infer<typeof ProfileRes>

// Body PUT /profile (copy từ backend, có sẵn thông báo lỗi tiếng Việt)
export const UpdateProfileBodySchema = z
  .object({
    name: z.string().trim().min(1, 'Vui lòng nhập tên').max(100),
    phoneNumber: z.string().trim().min(9, 'Số điện thoại không hợp lệ').max(15, 'Số điện thoại không hợp lệ'),
    // URL ảnh (lấy từ POST /uploads/image): gửi null để xóa avatar, không gửi thì giữ nguyên
    avatar: z.url('Avatar phải là một đường dẫn hợp lệ').max(1000).nullable().optional()
  })
  .strict()
export type UpdateProfileBodyType = z.infer<typeof UpdateProfileBodySchema>

// ===== Đổi mật khẩu: PUT /profile/password =====

// Body (copy từ backend). .refine: kiểm tra liên quan NHIỀU trường cùng lúc,
// path: lỗi hiện dưới ô nào trên form
export const ChangePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại').max(100),
    newPassword: z.string().min(8, 'Mật khẩu tối thiểu 8 kí tự').max(100),
    confirmPassword: z.string()
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword']
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
    path: ['newPassword']
  })
export type ChangePasswordBodyType = z.infer<typeof ChangePasswordBodySchema>

// Đổi xong backend thu hồi mọi phiên cũ và trả CẶP TOKEN MỚI: { message, data: { accessToken, refreshToken } }
// → giống hệt response của refresh token → dùng lại RefreshTokenBodyRes (như LoginBodyRes = RegisterBodyRes)
// Frontend phải ghi đè token cũ ở CẢ cookie (qua Route Handler) LẪN localStorage
export const ChangePasswordRes = RefreshTokenBodyRes
export type ChangePasswordResType = z.infer<typeof ChangePasswordRes>
