'use client'

import { useAppContext } from '@/components/app-provider'
import Logo from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import Link from 'next/link'
import { Suspense, useState } from 'react'
import HeaderSearch from './header-search'
import NavItems from './nav-items'

// Menu trượt từ phải, chỉ hiện trên màn hình nhỏ (md:hidden): ô tìm kiếm + menu + đăng nhập / đăng ký
export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const { isAuth } = useAppContext()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant='ghost' size='icon' className='md:hidden' aria-label='Mở menu'>
          <Menu className='size-5' />
        </Button>
      </SheetTrigger>
      <SheetContent side='right' className='w-72'>
        <SheetHeader>
          {/* SheetTitle bắt buộc có để trình đọc màn hình biết đây là hộp thoại gì */}
          <SheetTitle asChild>
            <Logo />
          </SheetTitle>
          <SheetDescription className='sr-only'>Menu điều hướng</SheetDescription>
        </SheetHeader>
        {/* Bấm vào link (thẻ <a>) hoặc gửi form tìm kiếm thì đóng menu, không thì menu vẫn che trang mới */}
        <div
          className='flex flex-col gap-4 px-4'
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('a')) setOpen(false)
          }}
          onSubmit={() => setOpen(false)}
        >
          <HeaderSearch />
          <nav className='flex flex-col gap-1'>
            <Suspense>
              <NavItems variant='list' />
            </Suspense>
          </nav>
          {!isAuth && (
            <div className='flex flex-col gap-2 border-t pt-4'>
              <Button asChild className='rounded-full'>
                <Link href='/login'>Đăng nhập</Link>
              </Button>
              <Button asChild variant='outline' className='rounded-full'>
                <Link href='/register'>Đăng ký</Link>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
