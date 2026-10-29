'use client'

import { useAppContext } from '@/components/app-provider'
import { checkAndRefreshToken } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { usePathname, useRouter } from '@/i18n/navigation'

// Những page sau sẽ không check refresh token (chưa đăng nhập, hoặc trang tự xử lý token)
const UNAUTHENTICATED_PATH = ['/login', '/logout', '/refresh-token', '/register']

// Component KHÔNG hiển thị gì, đặt trong AppProvider → chạy trên mọi trang khi web đang mở.
// Nhiệm vụ: làm mới access token TRƯỚC khi nó hết hạn, để người dùng không bao giờ gặp 401
export default function RefreshToken() {
  const pathname = usePathname()
  const router = useRouter()
  const { setRole } = useAppContext()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (UNAUTHENTICATED_PATH.includes(pathname)) return

    // Hàm bọc dùng CHUNG cho lần đầu và cho interval → lần nào cũng có onError
    const onRefreshToken = () => {
      checkAndRefreshToken({
        // Refresh lỗi / refresh token hết hạn = phiên đăng nhập đã chấm dứt
        onError: () => {
          clearInterval(interval) // dừng kiểm tra, không thử lại mỗi giây nữa
          setRole() // role = undefined + xóa token trong localStorage → menu về lúc chưa đăng nhập
          queryClient.clear() // xóa dữ liệu của phiên cũ trong cache
          router.push('/login')
        }
      })
    }

    // TIMEOUT phải nhỏ hơn nhiều so với thời gian sống của access token (15 phút):
    // mỗi giây kiểm tra 1 lần, còn dưới 1/3 thời gian sống thì checkAndRefreshToken mới gọi API
    const TIMEOUT = 1000
    // Tạo interval TRƯỚC rồi mới gọi lần đầu: nếu refresh token đã hết hạn, onError chạy NGAY
    // trong lần gọi đầu và cần clearInterval(interval) → interval phải tồn tại sẵn
    const interval = setInterval(onRefreshToken, TIMEOUT)
    // Gọi lần đầu ngay, không đợi 1 giây
    onRefreshToken()

    // Đổi trang / component bị hủy → dừng interval cũ (effect chạy lại sẽ tạo interval mới)
    return () => {
      clearInterval(interval)
    }
  }, [pathname, router, setRole, queryClient])

  return null
}
