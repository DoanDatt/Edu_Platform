'use client'

import { useAppContext } from '@/components/app-provider'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Chưa đăng nhập: "Đăng ký" + nút "Đăng nhập" nổi bật ở góc phải header.
// Đã đăng nhập: không hiện gì (AccountMenu hiện avatar thay vào chỗ này)
export default function AuthButtons() {
  const { isAuth } = useAppContext()
  if (isAuth) return null

  return (
    <div className='flex items-center gap-1'>
      {/* Màn hình nhỏ chỉ giữ nút Đăng nhập cho gọn (Đăng ký vẫn có trong menu trượt) */}
      <Button asChild variant='ghost' className='hidden rounded-full sm:inline-flex'>
        <Link href='/register'>Đăng ký</Link>
      </Button>
      <Button asChild className='rounded-full bg-linear-to-r from-sky-400 to-primary px-5 shadow-sm hover:opacity-90'>
        <Link href='/login'>Đăng nhập</Link>
      </Button>
    </div>
  )
}
