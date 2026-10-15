/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { EntityError } from './http'
import { toast } from 'sonner'
import { UseFormSetError } from 'react-hook-form'
import { RoleType } from '@/constants/type'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const normalizePath = (path: string) => {
  return path.startsWith('/') ? path.slice(1) : path
}

// Object → chuỗi query, BỎ QUA giá trị undefined / null / '' (không gửi = không lọc)
// { search: 'react', level: undefined, page: 2 } → '?search=react&page=2'
// Không có tham số nào → '' (không thêm dấu ?)
export const toQueryString = (query?: Record<string, string | number | boolean | undefined | null>) => {
  if (!query) return ''
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  })
  const result = params.toString()
  return result ? `?${result}` : ''
}

export const handleErrorApi = ({
  error,
  setError,
  duration
}: {
  error: any
  setError?: UseFormSetError<any>
  duration?: number
}) => {
  if (error instanceof EntityError && setError) {
    error.payload.errors.forEach((item) => {
      setError(item.field, {
        type: 'server',
        message: item.message
      })
    })
  } else {
    toast('Lỗi', {
      description: error?.payload?.message ?? 'Lỗi không xác định',
      duration: duration ?? 5000
    })
  }
}

// ===== Token trong localStorage =====

const isBrowser = typeof window !== 'undefined'

export const getAccessTokenFromLocalStorage = () => (isBrowser ? localStorage.getItem('accessToken') : null)

export const getRefreshTokenFromLocalStorage = () => (isBrowser ? localStorage.getItem('refreshToken') : null)

export const removeTokensFromLocalStorage = () => {
  if (!isBrowser) return
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

// Nội dung bên trong access token của backend Edu (backend/src/utils/jwt.ts)
// Lưu ý: tên là roleName, không phải role như khóa học
export type AccessTokenPayload = {
  userId: number
  roleName: RoleType
  iat: number // thời điểm tạo (giây)
  exp: number // thời điểm hết hạn (giây)
  jti: string // id riêng của token, để 2 token tạo cùng 1 giây vẫn khác nhau
}

// Đọc phần payload của JWT: header.PAYLOAD.signature
// KHÔNG kiểm tra chữ ký, chỉ dùng để hiển thị giao diện (ẩn/hiện menu...).
// Kiểm tra quyền thật sự là việc của backend
export const decodeAccessToken = (token: string) => {
  const payload = token.split('.')[1]
  // JWT dùng base64url (- và _), atob cần base64 thường (+ và /)
  const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
  return JSON.parse(json) as AccessTokenPayload
}
