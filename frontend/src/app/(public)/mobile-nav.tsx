'use client'

import Logo from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import { Suspense, useState } from 'react'
import NavItems from './nav-items'

// Menu trượt từ phải, chỉ hiện trên màn hình nhỏ (md:hidden)
export default function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant='outline' size='icon' className='md:hidden' aria-label='Mở menu'>
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
        {/* Bấm vào một link (thẻ <a>) thì đóng menu, không thì menu vẫn che trang mới */}
        <nav
          className='flex flex-col gap-1 px-4'
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('a')) setOpen(false)
          }}
        >
          <Suspense>
            <NavItems className='rounded-md px-3 py-2 text-base transition-colors hover:bg-accent hover:text-foreground' />
          </Suspense>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
