'use client'
import { RoleType } from '@/constants/type'
import { decodeAccessToken, getAccessTokenFromLocalStorage, removeTokensFromLocalStorage } from '@/lib/utils'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false
      // KHÔNG đặt refetchOnMount: false: sau khi invalidateQueries, quay lại trang danh sách
      // phải tải lại dữ liệu mới (ví dụ khóa vừa duyệt phải biến khỏi danh sách chờ duyệt)
    }
  }
})

// Trạng thái đăng nhập dùng chung cho cả app
//   role: role của người đang đăng nhập, chưa đăng nhập thì undefined
//   isAuth: đã đăng nhập chưa (= có role)
//   setRole: gọi sau khi đăng nhập / đăng ký thành công, gọi setRole() (không truyền gì) khi đăng xuất
const AppContext = createContext<{
  role: RoleType | undefined
  isAuth: boolean
  setRole: (role?: RoleType) => void
}>({
  role: undefined,
  isAuth: false,
  setRole: () => {}
})

export const useAppContext = () => useContext(AppContext)

// Đọc role từ access token đang lưu. Không có token hoặc token hỏng → undefined
const getRoleFromLocalStorage = (): RoleType | undefined => {
  const accessToken = getAccessTokenFromLocalStorage()
  if (!accessToken) return undefined
  try {
    return decodeAccessToken(accessToken).roleName
  } catch {
    return undefined
  }
}

function Provider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<RoleType | undefined>()

  // Server không đọc được localStorage nên lúc đầu role = undefined (coi như chưa đăng nhập).
  // Sang trình duyệt mới đọc token → cập nhật role, menu đổi theo
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ từ localStorage một lần khi mở app
    setRoleState(getRoleFromLocalStorage())
  }, [])

  // useCallback: giữ nguyên hàm giữa các lần render, component nào dùng setRole trong
  // useEffect sẽ không bị chạy lại vô ích
  const setRole = useCallback((role?: RoleType) => {
    setRoleState(role)
    if (!role) {
      removeTokensFromLocalStorage()
    }
  }, [])

  return <AppContext.Provider value={{ role, isAuth: Boolean(role), setRole }}>{children}</AppContext.Provider>
}

export default function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider>{children}</Provider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
