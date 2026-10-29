'use client'

import { useAppContext } from '@/components/app-provider'
import { Button } from '@/components/ui/button'
import { UserRound } from 'lucide-react'
import { Link } from '@/i18n/navigation'

// Chưa đăng nhập: nút "Đăng nhập" nhẹ (icon người dùng) ở góc phải header.
// Nút nổi bật của header là "Học miễn phí" → nút này để dạng ghost cho khỏi tranh nhau.
// Đăng ký: có link ngay trong trang đăng nhập, trong menu trượt (điện thoại) và nút ở cuối trang chủ.
// Đã đăng nhập: không hiện gì (AccountMenu hiện avatar thay vào chỗ này)
export default function AuthButtons() {
  const { isAuth } = useAppContext()
  if (isAuth) return null

  return (
    <Button asChild variant='ghost' className='rounded-full font-medium'>
      <Link href='/login'>
        <span className='flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary'>
          <UserRound className='size-4' />
        </span>
        Đăng nhập
      </Link>
    </Button>
  )
}
