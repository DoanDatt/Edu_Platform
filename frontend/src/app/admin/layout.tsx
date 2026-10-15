import AccountMenu from '@/components/account-menu'
import DarkModeToggle from '@/components/dark-mode-toggle'
import Logo from '@/components/logo'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import AdminMobileNav from './admin-mobile-nav'
import AdminNav from './admin-nav'

export const metadata: Metadata = {
  title: {
    default: 'Quản trị',
    template: '%s | Quản trị EduPlatform' // trang con đặt title 'Người dùng' → "Người dùng | Quản trị EduPlatform"
  },
  robots: { index: false } // trang quản trị không cho Google đưa lên kết quả tìm kiếm
}

// Chỉ admin vào được: proxy.ts đã chặn trước khi tới đây (sai role → về trang chủ)
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex min-h-screen w-full'>
      {/* Sidebar: chỉ hiện từ md (768px) trở lên, dính cố định khi cuộn trang */}
      <aside className='sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-muted/40 md:flex'>
        <div className='flex h-16 items-center border-b px-4'>
          <Logo />
        </div>
        <div className='flex-1 overflow-y-auto p-3'>
          <AdminNav />
        </div>
        <div className='border-t p-3'>
          <Link
            href='/'
            className='flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
          >
            <ArrowLeft className='size-4' />
            Về trang chủ
          </Link>
        </div>
      </aside>

      {/* min-w-0: cho phép phần nội dung co lại, bảng rộng không đẩy vỡ bố cục */}
      <div className='flex min-w-0 flex-1 flex-col'>
        <header className='sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur supports-backdrop-filter:bg-background/60 md:px-6'>
          <AdminMobileNav />
          <span className='font-semibold'>Quản trị</span>
          <div className='ml-auto flex items-center gap-2'>
            <DarkModeToggle />
            <AccountMenu />
          </div>
        </header>
        <main className='flex-1 p-4 md:p-6'>{children}</main>
      </div>
    </div>
  )
}
