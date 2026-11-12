import type { RefreshTokenBodyResType } from '@/schemaValidations/auth'
import { API_URL } from './env'
import { tokenStorage } from './token'

export class HttpError extends Error {
  constructor(
    public status: number,
    public payload: any
  ) {
    super(payload?.message ?? 'Có lỗi xảy ra')
  }
}

// Hết phiên hẳn (refresh cũng hỏng) → store đăng ký hàm này để đưa về màn đăng nhập
let onSessionExpired: (() => void) | undefined
export const setOnSessionExpired = (fn: () => void) => {
  onSessionExpired = fn
}

// Backend XOAY VÒNG refresh token (dùng 1 lần là bị xóa). 3 request cùng 401 mà cùng refresh
// thì 2 cái sau gửi token đã bị xóa → đăng xuất oan. Nên chỉ refresh 1 lần, các request khác chờ chung
let refreshing: Promise<string | null> | null = null

const refreshAccessToken = async () => {
  const refreshToken = await tokenStorage.getRefresh()
  if (!refreshToken) return null
  const res = await fetch(`${API_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  })
  if (!res.ok) return null
  const { data } = (await res.json()) as RefreshTokenBodyResType
  await tokenStorage.save(data.accessToken, data.refreshToken)
  return data.accessToken
}

const request = async <T>(method: string, path: string, body?: unknown, retried = false): Promise<T> => {
  const accessToken = await tokenStorage.getAccess()
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  // Có API trả body rỗng → không parse được thì coi như null
  const payload = await res.json().catch(() => null)

  // 401 ở /auth/login là sai mật khẩu, không phải hết hạn token → không refresh
  if (res.status === 401 && !retried && !path.startsWith('/auth/login')) {
    refreshing ??= refreshAccessToken().finally(() => {
      refreshing = null
    })
    const newToken = await refreshing
    if (newToken) return request<T>(method, path, body, true) // gọi lại đúng 1 lần
    await tokenStorage.clear()
    onSessionExpired?.()
  }

  if (!res.ok) throw new HttpError(res.status, payload)
  return payload as T
}

export const http = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path)
}
