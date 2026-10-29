'use client'
import { useAppContext } from '@/components/app-provider'
import { getAccessTokenFromLocalStorage } from '@/lib/utils'
import { useLogoutMutation } from '@/queries/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export default function Logout() {
  const t = useTranslations('Auth')
  const { mutateAsync } = useLogoutMutation()
  const router = useRouter()
  const { setRole } = useAppContext()
  const queryClient = useQueryClient()
  const accessTokenFromUrl = useSearchParams().get('accessToken')
  const isLoggingOut = useRef(false) // cờ: đang đăng xuất thì không gọi lần 2

  useEffect(() => {
    if (isLoggingOut.current) return // đang đăng xuất rồi (true) -> dừng, không gọi lần 2

    // Token trên URL không phải của trình duyệt này -> không đăng xuất
    if (!accessTokenFromUrl || accessTokenFromUrl !== getAccessTokenFromLocalStorage()) {
      router.push('/')
      return
    }

    isLoggingOut.current = true // dựng cờ: "tôi bắt đầu đăng xuất"
    mutateAsync().finally(() => {
      // gọi api logout, đợi xong
      setRole()
      queryClient.clear()
      router.push('/login')
      setTimeout(() => {
        isLoggingOut.current = false // 1s sau: hạ cờ (chạy đúng 1 lần)
      }, 1000)
    })
  }, [mutateAsync, accessTokenFromUrl, setRole, queryClient, router])

  return <p className='py-16 text-center text-muted-foreground'>{t('loggingOut')}</p>
}
