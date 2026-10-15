'use client'

import Logo from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import AdminNav from './admin-nav'

// Màn hình nhỏ: sidebar ẩn đi, thay bằng nút mở menu trượt từ trái
export default function AdminMobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant='outline' size='icon' className='md:hidden' aria-label='Mở menu quản trị'>
          <Menu className='size-5' />
        </Button>
      </SheetTrigger>
      <SheetContent side='left' className='w-64'>
        <SheetHeader>
          <SheetTitle asChild>
            <Logo />
          </SheetTitle>
          <SheetDescription className='sr-only'>Menu khu quản trị</SheetDescription>
        </SheetHeader>
        <div className='px-4'>
          {/* Chọn 1 mục thì đóng menu */}
          <AdminNav onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
