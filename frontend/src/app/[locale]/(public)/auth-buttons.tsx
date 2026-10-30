'use client'

import { useAppContext } from '@/components/app-provider'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

// Chưa đăng nhập: chữ "Đăng nhập / Đăng ký" ở góc phải header như EduPress (2 link cạnh nhau, ngăn bởi dấu /).
// Điện thoại: ẩn (có nút trong menu trượt).
// Đã đăng nhập: không hiện gì (AccountMenu hiện avatar thay vào chỗ này)
export default function AuthButtons() {
  const t = useTranslations('Header')
  const { isAuth } = useAppContext()
  if (isAuth) return null

  return (
    <p className='hidden items-center gap-1.5 text-base font-medium whitespace-nowrap sm:flex'>
      <Link href='/login' className='transition-colors hover:text-primary'>
        {t('login')}
      </Link>
      <span aria-hidden className='text-muted-foreground'>
        /
      </span>
      <Link href='/register' className='transition-colors hover:text-primary'>
        {t('register')}
      </Link>
    </p>
  )
}
