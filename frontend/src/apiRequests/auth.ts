import http from '@/lib/http'
import {
  LoginBodyResType,
  LoginBodyType,
  LogoutBodyType,
  MeResType,
  RegisterBodyResType,
  RegisterBodyType
} from '@/schemaValidations/auth.schema'
import { MessageResType } from '@/schemaValidations/common.schema'

export const authApiRequest = {
  sLogin: (body: LoginBodyType) => http.post<LoginBodyResType>('/auth/login', body),
  login: (body: LoginBodyType) =>
    http.post<LoginBodyResType>('/api/auth/login', body, {
      baseUrl: ''
    }),
  sRegister: (body: RegisterBodyType) => http.post<RegisterBodyResType>('/auth/register', body),
  register: (body: RegisterBodyType) =>
    http.post<RegisterBodyResType>('/api/auth/register', body, {
      baseUrl: ''
    }),
  // Server Next → backend. Khác khóa học: backend Edu KHÔNG cần header Authorization,
  // chỉ cần refreshToken trong body (access token hết hạn vẫn đăng xuất được)
  sLogout: (body: LogoutBodyType) => http.post<MessageResType>('/auth/logout', body),
  // Trình duyệt → Route Handler. Không cần gửi gì: token nằm sẵn trong cookie
  logout: () =>
    http.post<MessageResType>('/api/auth/logout', null, {
      baseUrl: ''
    }),
  // Thông tin người đang đăng nhập (tên, ảnh, role...). Gọi thẳng backend, http.ts tự gắn token
  me: () => http.get<MeResType>('/auth/me')
}
