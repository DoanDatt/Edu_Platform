import z from 'zod'

export const RegisterBodySchema = z
  .object({
    email: z.email('Email không hợp lệ'),
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 kí tự').max(100),
    confirmPassword: z.string(),
    name: z.string().trim().min(1, 'Vui lòng nhập tên').max(100),
    phoneNumber: z.string().min(9, 'Số điện thoại không hợp lệ').max(15, 'Số điện thoại không hợp lệ'),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })
export type RegisterBodyType = z.infer<typeof RegisterBodySchema>

export const LoginBodySchema = z
  .object({
    email: z.email('Email không hợp lệ'),
    password: z.string().min(1, 'Vui lòng nhập mật khẩu').max(100),
  })
  .strict()

export type LoginBodyType = z.infer<typeof LoginBodySchema>

export const RefreshTokenBodySchema = z
  .object({
    refreshToken: z.string().min(1, 'Thiếu refresh token'),
  })
  .strict()

export type RefreshTokenBodyType = z.infer<typeof RefreshTokenBodySchema>

export const LogoutBodySchema = RefreshTokenBodySchema
export type LogoutBodyType = z.infer<typeof LogoutBodySchema>

// ----- Quên mật khẩu -----

export const ForgotPasswordBodySchema = z
  .object({
    email: z.email('Email không hợp lệ'),
  })
  .strict()

export type ForgotPasswordBodyType = z.infer<typeof ForgotPasswordBodySchema>

const OtpCodeSchema = z.string().regex(/^\d{6}$/, 'Mã OTP gồm 6 chữ số')

export const VerifyOtpBodySchema = z
  .object({
    email: z.email('Email không hợp lệ'),
    code: OtpCodeSchema,
  })
  .strict()

export type VerifyOtpBodyType = z.infer<typeof VerifyOtpBodySchema>

export const ResetPasswordBodySchema = z
  .object({
    email: z.email('Email không hợp lệ'),
    code: OtpCodeSchema,
    newPassword: z.string().min(8, 'Mật khẩu tối thiểu 8 kí tự').max(100),
    confirmPassword: z.string(),
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

export type ResetPasswordBodyType = z.infer<typeof ResetPasswordBodySchema>
