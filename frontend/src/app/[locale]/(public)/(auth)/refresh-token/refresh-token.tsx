'use client'

import { useAppContext } from '@/components/app-provider'
import { checkAndRefreshToken, getRefreshTokenFromLocalStorage } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

// Chỉ cho quay về đường dẫn NỘI BỘ ('/my-courses'...). Chặn '//trang-khac.com' hay 'https://...':
// nếu không, kẻ xấu gửi link /refresh-token?redirect=https://trang-gia.com để dụ người dùng sang web giả
const getSafeRedirect = (redirect: string | null) =>
  redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/'

// proxy.ts chuyển tới đây khi: còn cookie refreshToken nhưng cookie accessToken đã hết hạn
// (thường là lâu ngày mới quay lại web). Làm mới token rồi đưa người dùng về đúng trang cũ.
// Khác khóa học: KHÔNG đưa refresh token lên URL (sẽ lưu vào lịch sử trình duyệt),
// Route Handler /api/auth/refresh-token tự đọc refresh token từ cookie
export default function RefreshToken() {
  const t = useTranslations('Auth')
  const router = useRouter()
  const { setRole } = useAppContext()
  const queryClient = useQueryClient()
  const redirectPathname = getSafeRedirect(useSearchParams().get('redirect'))

  useEffect(() => {
    // Hết phiên: dọn trạng thái đăng nhập rồi về trang đăng nhập.
    // router.replace (không phải push): bấm Back không quay lại trang /refresh-token
    const goToLogin = () => {
      setRole() // role = undefined + xóa token trong localStorage
      queryClient.clear()
      router.replace('/login')
    }

    // localStorage không có token (đã xóa, khác trình duyệt...) → không làm mới được
    if (!getRefreshTokenFromLocalStorage()) {
      goToLogin()
      return
    }

    // StrictMode chạy effect 2 lần cũng không sao: refreshToken() trong apiRequests/auth.ts
    // gom các lời gọi trùng thành 1 request
    checkAndRefreshToken({
      force: true, // cookie accessToken đã mất → luôn làm mới, không xét thời hạn trong localStorage
      onSuccess: () => router.replace(redirectPathname),
      onError: goToLogin
    })
  }, [router, setRole, queryClient, redirectPathname])

  return (
    <div className='flex flex-1 items-center justify-center gap-2 py-16 text-muted-foreground'>
      <Loader2 className='size-4 animate-spin' />
      {t('refreshing')}
    </div>
  )
}
