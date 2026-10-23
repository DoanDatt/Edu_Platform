import http from '@/lib/http'
import {
  ChangePasswordBodyType,
  ChangePasswordResType,
  ProfileResType,
  UpdateProfileBodyType
} from '@/schemaValidations/profile.schema'

const prefix = '/profile'

export const profileApiRequest = {
  // Client gọi thẳng backend (http.ts tự gắn token từ localStorage)
  get: () => http.get<ProfileResType>(prefix),
  update: (body: UpdateProfileBodyType) => http.put<ProfileResType>(prefix, body),

  // ===== Đổi mật khẩu: cặp sX / X giống sLogin / login =====
  // Đổi xong backend trả CẶP TOKEN MỚI → phải ghi đè cookie httpOnly, mà JavaScript ở trình duyệt
  // không ghi được cookie httpOnly → đi vòng qua Route Handler /api/profile/password:
  //   Trình duyệt ── changePassword ──▶ Route Handler ── sChangePassword ──▶ Backend
  //                                         └── ghi đè 2 cookie bằng token mới

  // Route Handler (server) → backend PUT /profile/password.
  // Ở server KHÔNG có localStorage → http.ts không tự gắn token được → nhận accessToken (đọc từ cookie)
  // rồi tự gắn header Authorization
  sChangePassword: (body: ChangePasswordBodyType, accessToken: string) =>
    http.put<ChangePasswordResType>(`${prefix}/password`, body, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }),

  // Trình duyệt → Route Handler của chính Next.js. baseUrl: '' → gọi cùng tên miền frontend
  // (/api/profile/password), không gọi sang backend
  changePassword: (body: ChangePasswordBodyType) =>
    http.put<ChangePasswordResType>('/api/profile/password', body, {
      baseUrl: ''
    })
}

export default profileApiRequest
