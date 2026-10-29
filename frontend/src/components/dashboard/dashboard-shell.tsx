import AccountMenu from '@/components/account-menu'
import DarkModeToggle from '@/components/dark-mode-toggle'
import Logo from '@/components/logo'
import NotificationBell from '@/components/notification-bell'
import { ArrowLeft } from 'lucide-react'
import { Suspense } from 'react'
import { DashboardMobileNav, DashboardNav } from './dashboard-nav'
import { DashboardMenuName } from './menus'
import { Link } from '@/i18n/navigation'

// Khung chung cho khu quản trị và khu giảng viên: sidebar trái + thanh trên + nội dung.
// Trước đây chỉ admin có → viết riêng trong app/admin. Có thêm khu giảng viên (chỗ dùng thứ 2)
// → tách ra đây, 2 layout chỉ khác tên khu và tiêu đề
export default function DashboardShell({
  menu,
  title,
  children
}: {
  menu: DashboardMenuName
  title: string
  children: React.ReactNode
}) {
  return (
    <div className='flex min-h-screen w-full'>
      {/* Sidebar: chỉ hiện từ md (768px) trở lên, dính cố định khi cuộn trang */}
      <aside className='sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-muted/40 md:flex'>
        <div className='flex h-16 items-center border-b px-4'>
          <Logo />
        </div>
        <div className='flex-1 overflow-y-auto p-3'>
          {/* DashboardNav dùng usePathname: ở route động (/instructor/courses/[id]) pathname chỉ biết
              lúc chạy → bọc Suspense (cùng lỗi blocking-prerender đã gặp ở header công khai) */}
          <Suspense>
            <DashboardNav menu={menu} />
          </Suspense>
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
          <Suspense>
            <DashboardMobileNav menu={menu} label={title} />
          </Suspense>
          <span className='font-semibold'>{title}</span>
          <div className='ml-auto flex items-center gap-2'>
            <DarkModeToggle />
            <NotificationBell />
            <AccountMenu />
          </div>
        </header>
        <main className='flex-1 p-4 md:p-6'>{children}</main>
      </div>
    </div>
  )
}
