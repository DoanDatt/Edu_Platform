import AccountMenu from '@/components/account-menu'
import DarkModeToggle from '@/components/dark-mode-toggle'
import Logo from '@/components/logo'
import NotificationBell from '@/components/notification-bell'
import Link from 'next/link'
import { Suspense } from 'react'
import AuthButtons from './auth-buttons'
import HeaderSearch from './header-search'
import MobileNav from './mobile-nav'
import NavItems from './nav-items'

// Layout chung cho các trang công khai: (public) là route group, KHÔNG có trong URL.
// Bố cục:
//   ┌── header: logo · tab menu (lg+) ········· ô tìm kiếm (md+) · nút ──┐
//   │  nội dung trang (giữa màn hình, rộng tối đa 7xl)                    │
//   │  footer                                                             │
// Màn hình nhỏ hơn lg: tab menu chuyển vào menu trượt (MobileNav)

// Các cột link ở footer (dùng lại bộ lọc có sẵn của trang /courses)
const footerLinks = [
  {
    title: 'Khám phá',
    links: [
      { label: 'Tất cả khóa học', href: '/courses' },
      { label: 'Khóa miễn phí', href: '/courses?price=free' },
      { label: 'Học nhiều nhất', href: '/courses?sort=popular' }
    ]
  },
  {
    title: 'Tài khoản',
    links: [
      { label: 'Đăng nhập', href: '/login' },
      { label: 'Đăng ký', href: '/register' },
      { label: 'Khóa của tôi', href: '/my-courses' }
    ]
  }
]

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    // overflow-x-clip: khối tràn ngang (banner trang chủ dùng w-screen) không làm trang bị cuộn ngang.
    // Dùng clip chứ không dùng hidden: hidden tạo khung cuộn mới → header sticky bên trong hết dính
    <div className='flex min-h-screen w-full flex-col overflow-x-clip'>
      {/* sticky: cuộn trang thì header vẫn dính trên cùng; backdrop-blur: nền mờ trong suốt */}
      <header className='sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70'>
        <div className='mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 md:px-6'>
          <Logo />
          <nav className='hidden items-center gap-1 lg:flex' aria-label='Điều hướng chính'>
            {/* NavItems dùng usePathname(): ở route động (/courses/[slug]) pathname chỉ biết lúc chạy
                → phải bọc Suspense, không thì Next báo lỗi blocking-prerender */}
            <Suspense>
              <NavItems variant='tabs' />
            </Suspense>
          </nav>
          {/* ml-auto: đẩy ô tìm kiếm + cụm nút sang phải */}
          <HeaderSearch className='ml-auto hidden w-full max-w-xs md:block' />
          <div className='ml-auto flex items-center gap-1 md:ml-0'>
            <DarkModeToggle />
            {/* Đã đăng nhập: chuông thông báo (chưa đăng nhập thì không hiện gì) */}
            <NotificationBell />
            {/* Chưa đăng nhập: Đăng ký + Đăng nhập. Đã đăng nhập: avatar + menu tài khoản */}
            <AuthButtons />
            <AccountMenu />
            {/* Dưới lg: nút mở menu trượt (có ô tìm kiếm + menu) */}
            <MobileNav />
          </div>
        </div>
      </header>

      {/* min-w-0: cho phép nội dung co lại, không bị bảng / chữ dài đẩy tràn ngang */}
      <main className='mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col px-4 py-6 md:px-6 md:py-8'>
        {children}
      </main>

      <footer className='mt-10 border-t bg-muted/50'>
        <div className='mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 text-sm md:grid-cols-[2fr_1fr_1fr] md:px-6'>
          <div className='flex max-w-sm flex-col gap-3'>
            <Logo />
            <p className='text-muted-foreground'>
              Học lập trình, thiết kế, marketing, khoa học dữ liệu theo tốc độ của riêng bạn. Mọi lúc, mọi nơi.
            </p>
          </div>
          {footerLinks.map((group) => (
            <nav key={group.title} aria-label={group.title} className='flex flex-col gap-2.5'>
              <h3 className='font-semibold'>{group.title}</h3>
              {group.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className='w-fit text-muted-foreground transition-colors hover:text-primary'
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>
        <div className='border-t'>
          <p className='mx-auto w-full max-w-7xl px-4 py-4 text-xs text-muted-foreground md:px-6'>
            © 2026 EduPlatform · Dự án cá nhân, thiết kế và phát triển bởi Đoàn Công Đạt
          </p>
        </div>
      </footer>
    </div>
  )
}
