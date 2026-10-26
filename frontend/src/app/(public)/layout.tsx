import AccountMenu from '@/components/account-menu'
import DarkModeToggle from '@/components/dark-mode-toggle'
import Logo from '@/components/logo'
import Link from 'next/link'
import { Suspense } from 'react'
import AuthButtons from './auth-buttons'
import HeaderSearch from './header-search'
import MobileNav from './mobile-nav'
import NavItems from './nav-items'

// Layout chung cho các trang công khai: (public) là route group, KHÔNG có trong URL.
// Bố cục (học theo phong cách F8):
//   ┌──────────── header: logo · ô tìm kiếm · nút ────────────┐
//   │ cột icon │  nội dung trang                               │
//   │ (md+)    │  footer                                       │
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex min-h-screen w-full flex-col'>
      {/* sticky: cuộn trang thì header vẫn dính trên cùng; backdrop-blur: nền mờ trong suốt */}
      <header className='sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70'>
        <div className='flex h-16 items-center gap-4 px-4 md:px-6'>
          <Logo />
          {/* mx-auto: đẩy ô tìm kiếm vào giữa khoảng trống giữa logo và cụm nút */}
          <HeaderSearch className='mx-auto hidden w-full max-w-md md:block' />
          <div className='ml-auto flex items-center gap-1 md:ml-0'>
            <DarkModeToggle />
            {/* Chưa đăng nhập: Đăng ký + Đăng nhập. Đã đăng nhập: avatar + menu tài khoản */}
            <AuthButtons />
            <AccountMenu />
            {/* Màn hình nhỏ: nút mở menu trượt (có ô tìm kiếm + menu) */}
            <MobileNav />
          </div>
        </div>
      </header>

      <div className='flex flex-1'>
        {/* Cột icon bên trái, chỉ từ md (768px). sticky + chiều cao màn hình trừ header: cuộn trang vẫn đứng yên */}
        <aside className='sticky top-16 hidden h-[calc(100svh-4rem)] w-24 shrink-0 md:block'>
          <nav className='flex flex-col items-center gap-1 pt-4' aria-label='Điều hướng chính'>
            {/* NavItems dùng usePathname(): ở route động (/courses/[slug]) pathname chỉ biết lúc chạy
                → phải bọc Suspense, không thì Next báo lỗi blocking-prerender */}
            <Suspense>
              <NavItems variant='rail' />
            </Suspense>
          </nav>
        </aside>

        {/* min-w-0: cho phép cột nội dung co lại, không bị bảng / chữ dài đẩy tràn ngang */}
        <div className='flex min-w-0 flex-1 flex-col'>
          <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 md:px-6 md:py-8'>{children}</main>

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
      </div>
    </div>
  )
}
