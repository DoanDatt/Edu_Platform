import AccountMenu from '@/components/account-menu'
import DarkModeToggle from '@/components/dark-mode-toggle'
import LocaleSwitcher from '@/components/locale-switcher'
import Logo from '@/components/logo'
import NotificationBell from '@/components/notification-bell'
import { Suspense } from 'react'
import AuthButtons from './auth-buttons'
import HeaderSearch from './header-search'
import MobileNav from './mobile-nav'
import MainMenu from './main-menu'
import OrdersButton from './orders-button'
import categoryApiRequest from '@/apiRequests/category'
import { Button } from '@/components/ui/button'
import { Gift } from 'lucide-react'
import { Link } from '@/i18n/navigation'

// Layout chung cho các trang công khai: (public) là route group, KHÔNG có trong URL.
// Bố cục:
//   ┌── header tầng trên: logo · ô tìm kiếm (md+) · giỏ · chuông · tài khoản · Học miễn phí ──┐
//   │   header tầng dưới (lg+): Trang chủ · Khóa học ▾ · Học tập ▾ · Giảng dạy ▾ / Quản trị ▾  │
//   │  nội dung trang (giữa màn hình, rộng tối đa 7xl)                                         │
//   │  footer                                                                                  │
// Màn hình nhỏ hơn lg: menu tầng dưới chuyển vào menu trượt (MobileNav)

// Các cột link ở footer (dùng lại bộ lọc có sẵn của trang /courses)
const footerLinks = [
  {
    title: 'Khám phá',
    links: [
      { label: 'Tất cả khóa học', href: '/courses' },
      { label: 'Khóa miễn phí', href: '/courses?price=free' },
      { label: 'Học nhiều nhất', href: '/courses?sort=popular' },
      { label: 'Blog', href: '/blog' },
      { label: 'Giới thiệu', href: '/about' }
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
      {/* Header 2 tầng, sticky: cuộn trang thì vẫn dính trên cùng; backdrop-blur: nền mờ trong suốt */}
      <header className='sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70'>
        {/* ===== Tầng trên: logo · ô tìm kiếm · giỏ (đơn chờ) · chuông · tài khoản · Học miễn phí ===== */}
        <div className='mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 md:px-6'>
          <Logo />
          {/* Ô tìm kiếm kèm ô chọn danh mục (danh mục lấy ở server; đang tải thì hiện ô tìm kiếm không có ô chọn) */}
          <Suspense fallback={<HeaderSearch className={headerSearchClass} />}>
            <HeaderSearchWithCategories />
          </Suspense>
          <div className='ml-auto flex items-center gap-1 md:ml-0'>
            <LocaleSwitcher />
            <DarkModeToggle />
            {/* Đã đăng nhập: giỏ (đơn chờ thanh toán) + chuông thông báo. Chưa đăng nhập: không hiện */}
            <OrdersButton />
            <NotificationBell />
            {/* Chưa đăng nhập: nút Đăng nhập. Đã đăng nhập: avatar + menu tài khoản */}
            <AuthButtons />
            <AccountMenu />
            <Button
              asChild
              className='ml-2 hidden rounded-full bg-linear-to-r from-sky-500 to-blue-600 px-5 font-semibold shadow-md shadow-sky-500/25 hover:opacity-95 sm:inline-flex'
            >
              <Link href='/courses?price=free'>
                <Gift />
                Học miễn phí
              </Link>
            </Button>
            {/* Dưới lg: nút mở menu trượt (có ô tìm kiếm + menu) */}
            <MobileNav />
          </div>
        </div>

        {/* ===== Tầng dưới (máy tính): menu chính có menu con xổ xuống ===== */}
        <nav className='hidden border-t lg:block' aria-label='Điều hướng chính'>
          {/* relative: tấm menu lớn (Khóa học, Blog) định vị theo khung này → canh giữa cả thanh menu */}
          <div className='relative mx-auto w-full max-w-7xl px-4 md:px-6'>
            {/* MainMenu dùng usePathname(): ở route động pathname chỉ biết lúc chạy → bọc Suspense.
                Danh mục cho menu "Khóa học" lấy ở server (HeaderMenu) */}
            <Suspense fallback={<div className='h-12' />}>
              <HeaderMenu />
            </Suspense>
          </div>
        </nav>
      </header>

      {/* min-w-0: cho phép nội dung co lại, không bị bảng / chữ dài đẩy tràn ngang */}
      {/* pb lớn thay cho margin-top của footer: khối tràn ngang cuối trang (dải kêu gọi ở trang chủ)
          dùng margin âm đúng bằng pb này để nối liền với footer */}
      <main className='mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col px-4 pt-6 pb-16 md:px-6 md:pt-8 md:pb-20'>
        {children}
      </main>

      <footer className='border-t bg-muted/50'>
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

// Menu tầng dưới của header + danh mục cho menu lớn "Khóa học". Lỗi API → menu vẫn hiện, chỉ thiếu phần danh mục
async function HeaderMenu() {
  const categories = await categoryApiRequest
    .list({ limit: 100 })
    .then((res) => res.payload.data)
    .catch(() => [])
  return <MainMenu categories={categories} />
}

// mx-auto: ô tìm kiếm nằm giữa khoảng trống giữa logo và cụm nút; điện thoại ẩn (có trong menu trượt)
const headerSearchClass = 'mx-auto hidden w-full max-w-xl md:flex'

async function HeaderSearchWithCategories() {
  const categories = await categoryApiRequest
    .list({ limit: 100 })
    .then((res) => res.payload.data)
    .catch(() => [])
  return <HeaderSearch className={headerSearchClass} categories={categories} />
}
