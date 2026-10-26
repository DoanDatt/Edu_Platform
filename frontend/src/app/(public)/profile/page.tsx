import { Button } from '@/components/ui/button'
import { KeyRound } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import ProfileForm from './profile-form'

export const metadata: Metadata = {
  title: 'Hồ sơ của tôi'
}

// Server Component: tiêu đề + metadata. Form là Client Component (dùng useProfileQuery, useMutation).
// Chưa đăng nhập → proxy.ts chuyển về /login ('/profile' nằm trong privatePaths)
export default function ProfilePage() {
  return (
    <div className='mx-auto flex w-full max-w-2xl flex-col gap-6'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Hồ sơ của tôi</h1>
          <p className='text-muted-foreground'>Cập nhật thông tin hiển thị trên EduPlatform.</p>
        </div>
        <Button asChild variant='outline'>
          <Link href='/profile/change-password'>
            <KeyRound />
            Đổi mật khẩu
          </Link>
        </Button>
      </div>
      <ProfileForm />
    </div>
  )
}
