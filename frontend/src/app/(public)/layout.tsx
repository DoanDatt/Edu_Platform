import AccountMenu from '@/components/account-menu'
import DarkModeToggle from '@/components/dark-mode-toggle'
import Logo from '@/components/logo'
import Link from 'next/link'
import { Suspense } from 'react'
import MobileNav from './mobile-nav'
import NavItems from './nav-items'

// Layout chung cho các trang công khai: (public) là route group, KHÔNG có trong URL
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex min-h-screen w-full flex-col'>
      {/* sticky: cuộn trang thì header vẫn dính trên cùng; backdrop-blur: nền mờ trong suốt */}
      <header className='sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60'>
        <div className='mx-auto flex h-16 w-full max-w-7xl items-center gap-8 px-4 md:px-6'>
          <Logo />
          {/* Màn hình từ md (768px) trở lên: menu nằm ngang */}
          <nav className='hidden items-center gap-6 text-sm md:flex'>
            {/* NavItems dùng usePathname(): ở route động (/courses/[slug]) pathname chỉ biết lúc chạy
                → phải bọc Suspense, không thì Next báo lỗi blocking-prerender */}
            <Suspense>
              <NavItems className='transition-colors hover:text-foreground' />
            </Suspense>
          </nav>
          <div className='ml-auto flex items-center gap-2'>
            <DarkModeToggle />
            {/* Đã đăng nhập: avatar + menu tài khoản. Chưa đăng nhập: không hiện gì */}
            <AccountMenu />
            {/* Màn hình nhỏ: nút mở menu trượt */}
            <MobileNav />
          </div>
        </div>
      </header>

      <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 md:px-6 md:py-10'>{children}</main>

      <footer className='border-t bg-muted/40'>
        <div className='mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6'>
          <div className='flex flex-col gap-2'>
            <Logo className='text-foreground' />
            <p>Học lập trình, thiết kế, marketing... mọi lúc, mọi nơi.</p>
          </div>
          <nav className='flex gap-6'>
            <Link href='/courses' className='transition-colors hover:text-foreground'>
              Khóa học
            </Link>
            <Link href='/register' className='transition-colors hover:text-foreground'>
              Trở thành học viên
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
