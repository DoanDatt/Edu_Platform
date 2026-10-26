/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { EntityError } from './http'
import { toast } from 'sonner'
import { UseFormSetError } from 'react-hook-form'
import { RoleType } from '@/constants/type'
import authApiRequest from '@/apiRequests/auth'

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

// Trả MẢNG MỚI với phần tử ở vị trí from chuyển sang vị trí to (không sửa mảng cũ)
// moveItem([1, 2, 3], 2, 0) → [3, 1, 2]
export const moveItem = <T>(items: T[], from: number, to: number) => {
  const next = [...items]
  const [item] = next.splice(from, 1) // rút phần tử ra
  next.splice(to, 0, item) // chèn vào chỗ mới
  return next
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
    // 422 mà không có form để gắn lỗi (ví dụ upload file hỏng) → hiện lỗi chi tiết đầu tiên,
    // "Nội dung file không đúng định dạng" rõ hơn câu chung "Dữ liệu không hợp lệ"
    const detail = error instanceof EntityError ? error.payload.errors[0]?.message : undefined
    toast('Lỗi', {
      description: detail ?? error?.payload?.message ?? 'Lỗi không xác định',
      duration: duration ?? 5000
    })
  }
}

// ===== Token trong localStorage =====

const isBrowser = typeof window !== 'undefined'

export const getAccessTokenFromLocalStorage = () => (isBrowser ? localStorage.getItem('accessToken') : null)

export const getRefreshTokenFromLocalStorage = () => (isBrowser ? localStorage.getItem('refreshToken') : null)

export const setAccessTokenToLocalStorage = (value: string) => isBrowser && localStorage.setItem('accessToken', value)
export const setRefreshTokenToLocalStorage = (value: string) => isBrowser && localStorage.setItem('refreshToken', value)

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

// Nội dung bên trong refresh token: KHÔNG có roleName (role đọc từ access token)
export type RefreshTokenPayload = {
  userId: number
  iat: number
  exp: number
  jti: string
}

// Đọc phần payload của JWT bất kỳ: header.PAYLOAD.signature
// Dùng atob có sẵn của trình duyệt, KHÔNG dùng thư viện jsonwebtoken (viết cho Node.js / server).
// KHÔNG kiểm tra chữ ký, chỉ dùng để hiển thị / hẹn giờ làm mới token.
// Kiểm tra quyền thật sự là việc của backend
// <T>: kiểu của payload, người gọi tự chọn (AccessTokenPayload hoặc RefreshTokenPayload)
export const decodeToken = <T>(token: string) => {
  const payload = token.split('.')[1]
  // JWT dùng base64url (- và _), atob cần base64 thường (+ và /)
  const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
  return JSON.parse(json) as T
}

// Giữ tên cũ cho các file đang dùng (app-provider.tsx...)
export const decodeAccessToken = (token: string) => decodeToken<AccessTokenPayload>(token)

// force: true → làm mới NGAY, không cần đợi access token còn dưới 1/3 thời gian sống.
// Trang /refresh-token dùng: cookie accessToken đã mất (proxy chuyển tới) nhưng access token
// trong localStorage có thể vẫn còn hạn → nếu không ép thì hàm không làm gì, trang bị kẹt
export const checkAndRefreshToken = async (params?: {
  onError?: () => void
  onSuccess?: () => void
  force?: boolean
}) => {
  const accessToken = getAccessTokenFromLocalStorage()
  const refreshToken = getRefreshTokenFromLocalStorage()
  if (!accessToken || !refreshToken) return
  const decodedAccessToken = decodeAccessToken(accessToken)
  const decodedRefreshToken = decodeToken<RefreshTokenPayload>(refreshToken)

  const now = Math.round(new Date().getTime() / 1000)

  if (decodedRefreshToken.exp <= now) {
    removeTokensFromLocalStorage()
    params?.onError?.()
    return
  }

  // Access token sống 15 phút → còn dưới 5 phút (1/3) thì làm mới
  if (params?.force || decodedAccessToken.exp - now < (decodedAccessToken.exp - decodedAccessToken.iat) / 3) {
    try {
      const res = await authApiRequest.refreshToken()
      setAccessTokenToLocalStorage(res.payload.data.accessToken)
      setRefreshTokenToLocalStorage(res.payload.data.refreshToken)
      params?.onSuccess?.()
    } catch {
      params?.onError?.()
    }
  }
}
