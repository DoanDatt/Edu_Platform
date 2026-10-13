import { RoleValues, UserStatus } from '@/constants/type'
import z from 'zod'

export const RegisterBodySchema = z
  .object({
    email: z.email('Email không hợp lệ'),
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 kí tự').max(100),
    confirmPassword: z.string(),
    name: z.string().trim().min(1, 'Vui lòng nhập tên').max(100),
    phoneNumber: z.string().min(9, 'Số điện thoại không hợp lệ').max(15, 'Số điện thoại không hợp lệ')
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword']
  })
export type RegisterBodyType = z.infer<typeof RegisterBodySchema>

export const RegisterBodyRes = z.object({
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    account: z.object({
      id: z.number(),
      name: z.string(),
      email: z.string(),
      role: z.enum(RoleValues)
    })
  }),
  message: z.string()
})

export type RegisterBodyResType = z.infer<typeof RegisterBodyRes>

export const LoginBodySchema = z
  .object({
    email: z.email('Email không hợp lệ'),
    password: z.string().min(1, 'Vui lòng nhập mật khẩu').max(100)
  })
  .strict()

export type LoginBodyType = z.infer<typeof LoginBodySchema>

export const LoginBodyRes = RegisterBodyRes

export type LoginBodyResType = z.infer<typeof LoginBodyRes>

export const RefreshTokenBodySchema = z
  .object({
    refreshToken: z.string().min(1, 'Thiếu refresh token')
  })
  .strict()

export type RefreshTokenBodyType = z.infer<typeof RefreshTokenBodySchema>

export const RefreshTokenBodyRes = z.object({
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string()
  }),
  message: z.string()
})

export type RefreshTokenBodyResType = z.infer<typeof RefreshTokenBodyRes>

export const LogoutBodySchema = z
  .object({
    refreshToken: z.string().min(1, 'Thiếu refresh token')
  })
  .strict()

export type LogoutBodyType = z.infer<typeof LogoutBodySchema>

// GET /auth/me: thông tin đầy đủ của người đang đăng nhập (dùng khi tải lại trang)
// Khác account của login: có phoneNumber, avatar, status, và role là object { id, name }
export const MeRes = z.object({
  data: z.object({
    id: z.number(),
    email: z.string(),
    name: z.string(),
    phoneNumber: z.string(),
    avatar: z.string().nullable(),
    status: z.enum(UserStatus),
    roleId: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
    role: z.object({
      id: z.number(),
      name: z.enum(RoleValues)
    })
  }),
  message: z.string()
})

export type MeResType = z.infer<typeof MeRes>
