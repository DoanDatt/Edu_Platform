'use client'

import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'

// Bị đăng xuất vì admin khóa tài khoản (http.ts chuyển tới /login?reason=blocked) → báo lý do ngay trên form.
// Tách component riêng: useSearchParams cần <Suspense>, bọc riêng khối này thì form đăng nhập vẫn hiện ngay
export default function BlockedNotice() {
  const t = useTranslations('Auth')
  if (useSearchParams().get('reason') !== 'blocked') return null
  return (
    <p role='alert' className='w-full max-w-sm rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive'>
      {t('accountBlocked')}
    </p>
  )
}
