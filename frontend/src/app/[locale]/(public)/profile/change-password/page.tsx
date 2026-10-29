import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import ChangePasswordForm from './change-password-form'
import { Link } from '@/i18n/navigation'

export const metadata: Metadata = {
  title: 'Đổi mật khẩu'
}

// /profile/change-password (link "Đổi mật khẩu" trong menu tài khoản trên header trỏ tới đây).
// proxy.ts chặn cả /profile/* khi chưa đăng nhập
export default function ChangePasswordPage() {
  return (
    <div className='mx-auto flex w-full max-w-md flex-col gap-6'>
      <div className='flex flex-col gap-3'>
        <Button asChild variant='ghost' size='sm' className='self-start'>
          <Link href='/profile'>
            <ArrowLeft />
            Hồ sơ của tôi
          </Link>
        </Button>
        <h1 className='text-3xl font-bold tracking-tight'>Đổi mật khẩu</h1>
        <p className='text-muted-foreground'>
          Sau khi đổi, các thiết bị khác đang đăng nhập tài khoản này sẽ bị đăng xuất.
        </p>
      </div>
      <ChangePasswordForm />
    </div>
  )
}
