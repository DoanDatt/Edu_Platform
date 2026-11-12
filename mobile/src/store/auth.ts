import { create } from 'zustand'
import { http, setOnSessionExpired } from '@/lib/http'
import { tokenStorage } from '@/lib/token'
import type { LoginBodyResType, LoginBodyType, MeResType } from '@/schemaValidations/auth'

// { id, name, email, role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT' } — lấy từ type của API login
type Account = LoginBodyResType['data']['account']

type AuthState = {
  // 'loading': mới mở app, đang kiểm tra token cũ → chưa biết hiện màn nào
  status: 'loading' | 'signedIn' | 'signedOut'
  account: Account | null
  bootstrap: () => Promise<void>
  login: (body: LoginBodyType) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  account: null,

  // Mở app: còn token thì hỏi /auth/me (access token hết hạn thì http.ts tự refresh)
  bootstrap: async () => {
    if (!(await tokenStorage.getRefresh())) return set({ status: 'signedOut' })
    try {
      const { data } = await http.get<MeResType>('/auth/me')
      // /auth/me trả role là object { id, name } → lấy name cho khớp kiểu Account của login
      set({ status: 'signedIn', account: { id: data.id, name: data.name, email: data.email, role: data.role.name } })
    } catch {
      await tokenStorage.clear()
      set({ status: 'signedOut', account: null })
    }
  },

  login: async (body) => {
    const { data } = await http.post<LoginBodyResType>('/auth/login', body)
    await tokenStorage.save(data.accessToken, data.refreshToken)
    set({ status: 'signedIn', account: data.account })
  },

  logout: async () => {
    const refreshToken = await tokenStorage.getRefresh()
    // Báo backend xóa refresh token; lỗi mạng cũng vẫn đăng xuất ở máy
    if (refreshToken) await http.post('/auth/logout', { refreshToken }).catch(() => {})
    await tokenStorage.clear()
    set({ status: 'signedOut', account: null })
  }
}))

// Refresh hỏng giữa chừng (http.ts báo) → về màn đăng nhập
setOnSessionExpired(() => useAuthStore.setState({ status: 'signedOut', account: null }))
