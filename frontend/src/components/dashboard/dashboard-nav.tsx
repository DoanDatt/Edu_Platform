'use client'

import Logo from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { dashboardMenus, DashboardMenuName } from './menus'
import { Link, usePathname } from '@/i18n/navigation'

// Danh sách link sidebar, dùng chung cho sidebar máy tính và menu trượt điện thoại
export function DashboardNav({ menu, onNavigate }: { menu: DashboardMenuName; onNavigate?: () => void }) {
  const pathname = usePathname()
  const { rootHref, items } = dashboardMenus[menu]

  return (
    <nav className='flex flex-col gap-1'>
      {items.map(({ title, href, Icon }) => {
        // Trang gốc ('/admin', '/instructor') phải so sánh bằng, không thì trang con nào cũng tô đậm nó
        const isActive = href === rootHref ? pathname === rootHref : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <Icon className='size-4' />
            {title}
          </Link>
        )
      })}
    </nav>
  )
}

// Màn hình nhỏ: sidebar ẩn đi, thay bằng nút mở menu trượt từ trái
export function DashboardMobileNav({ menu, label }: { menu: DashboardMenuName; label: string }) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant='outline' size='icon' className='md:hidden' aria-label={`Mở menu ${label}`}>
          <Menu className='size-5' />
        </Button>
      </SheetTrigger>
      <SheetContent side='left' className='w-64'>
        <SheetHeader>
          <SheetTitle asChild>
            <Logo />
          </SheetTitle>
          <SheetDescription className='sr-only'>Menu khu {label}</SheetDescription>
        </SheetHeader>
        <div className='px-4'>
          {/* Chọn 1 mục thì đóng menu */}
          <DashboardNav menu={menu} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
