'use client'

import { useAppContext } from '@/components/app-provider'
import { getCategoryStyle } from '@/constants/category'
import { RoleType, RoleValues } from '@/constants/type'
import { cn } from '@/lib/utils'
import { CategoryListItemType } from '@/schemaValidations/category.schema'
import {
  BookOpen,
  ChevronDown,
  Flame,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LucideIcon,
  Plus,
  ReceiptText,
  Sparkles,
  Tags,
  UserRound,
  Users,
  Gift
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type MenuLink = { label: string; href: string; Icon: LucideIcon; description?: string }
type MenuGroup = { title?: string; links: MenuLink[] }
type MenuItem = {
  label: string
  href: string // bấm thẳng vào mục (không mở menu con) thì đi tới đây
  match: string[] // đang ở các đường dẫn này (hoặc trang con) thì tô đậm mục
  roles?: RoleType[] // có thì chỉ hiện khi đăng nhập đúng vai trò
  groups?: MenuGroup[] // menu con
}

const courseLinks: MenuLink[] = [
  { label: 'Tất cả khóa học', href: '/courses', Icon: BookOpen, description: 'Tìm, lọc theo trình độ, giá' },
  { label: 'Khóa miễn phí', href: '/courses?price=free', Icon: Gift, description: 'Bắt đầu học ngay' },
  { label: 'Học nhiều nhất', href: '/courses?sort=popular', Icon: Flame, description: 'Được đăng ký nhiều nhất' },
  { label: 'Mới ra mắt', href: '/courses?sort=newest', Icon: Sparkles, description: 'Vừa được xuất bản' }
]

const menuItems: MenuItem[] = [
  { label: 'Trang chủ', href: '/', match: [] },
  { label: 'Khóa học', href: '/courses', match: ['/courses'], groups: [{ links: courseLinks }] },
  {
    label: 'Học tập',
    href: '/my-courses',
    match: ['/my-courses', '/my-orders', '/profile'],
    roles: [RoleValues.Student, RoleValues.Instructor, RoleValues.Admin],
    groups: [
      {
        links: [
          { label: 'Khóa học của tôi', href: '/my-courses', Icon: GraduationCap },
          { label: 'Lịch sử mua hàng', href: '/my-orders', Icon: ReceiptText },
          { label: 'Thông tin tài khoản', href: '/profile', Icon: UserRound },
          { label: 'Đổi mật khẩu', href: '/profile/change-password', Icon: KeyRound }
        ]
      }
    ]
  },
  {
    label: 'Giảng dạy',
    href: '/instructor',
    match: ['/instructor'],
    roles: [RoleValues.Instructor],
    groups: [
      {
        links: [
          { label: 'Tổng quan', href: '/instructor', Icon: LayoutDashboard, description: 'Học viên, doanh thu' },
          { label: 'Khóa học của tôi', href: '/instructor/courses', Icon: BookOpen },
          { label: 'Tạo khóa học mới', href: '/instructor/courses/new', Icon: Plus }
        ]
      }
    ]
  },
  {
    label: 'Quản trị',
    href: '/admin',
    match: ['/admin'],
    roles: [RoleValues.Admin],
    groups: [
      {
        links: [
          { label: 'Dashboard', href: '/admin', Icon: LayoutDashboard, description: 'Số liệu, doanh thu' },
          { label: 'Duyệt khóa học', href: '/admin/courses', Icon: BookOpen },
          { label: 'Danh mục', href: '/admin/categories', Icon: Tags },
          { label: 'Người dùng', href: '/admin/users', Icon: Users }
        ]
      }
    ]
  }
]

// Bấm 1 link trong menu con: bỏ focus khỏi link → hết focus-within → menu đóng lại sau khi chuyển trang
// (header không bị tải lại khi chuyển trang trong Next, không bỏ focus thì menu cứ mở mãi)
const closeMenu = () => (document.activeElement as HTMLElement | null)?.blur()

// Tầng dưới của header (máy tính): các mục, rê chuột vào mục có mũi tên thì menu con xổ xuống.
// Mở bằng CSS (group-hover + group-focus-within), không cần state: dùng bàn phím Tab vào mục cũng mở được,
// rời chuột / Tab ra ngoài là tự đóng. Mục theo vai trò (Học tập, Giảng dạy, Quản trị) chỉ hiện khi có quyền.
// "Khóa học" là menu lớn: lối tắt bên trái + danh sách chủ đề bên phải (lấy ở server, truyền vào qua props)
export default function MainMenu({ categories }: { categories: CategoryListItemType[] }) {
  const pathname = usePathname()
  const { role } = useAppContext()

  const isActive = (item: MenuItem) =>
    item.match.length === 0
      ? pathname === '/'
      : item.match.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  return (
    <ul className='flex items-center gap-1'>
      {menuItems.map((item) => {
        if (item.roles && (!role || !item.roles.includes(role))) return null
        const active = isActive(item)
        const isCourses = item.href === '/courses'
        return (
          <li key={item.label} className='group relative'>
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              onClick={closeMenu}
              className={cn(
                'flex h-12 items-center gap-1 px-3 text-sm font-medium transition-colors',
                active ? 'text-primary' : 'text-foreground/80 hover:text-primary'
              )}
            >
              {item.label}
              {item.groups && (
                <ChevronDown className='size-3.5 transition-transform group-focus-within:rotate-180 group-hover:rotate-180' />
              )}
            </Link>
            {/* Gạch chân mục đang mở / đang ở */}
            <span
              aria-hidden
              className={cn(
                'absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary transition-transform',
                active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
              )}
            />

            {item.groups && (
              // invisible (không phải hidden): vẫn giữ chỗ để hiệu ứng mờ dần chạy được, nhưng không bấm / Tab vào được khi đóng
              <div className='invisible absolute top-full left-0 z-50 pt-2 opacity-0 transition-all duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100'>
                <div
                  className={cn(
                    'rounded-2xl border bg-popover p-2 text-popover-foreground shadow-2xl shadow-sky-900/10',
                    isCourses && categories.length > 0 ? 'grid w-[38rem] grid-cols-2 gap-2' : 'w-72'
                  )}
                >
                  {item.groups.map((group, index) => (
                    <div key={index} className='flex flex-col'>
                      {group.links.map((link) => (
                        <MenuEntry key={link.href} link={link} />
                      ))}
                    </div>
                  ))}
                  {isCourses && categories.length > 0 && (
                    <div className='flex flex-col rounded-xl bg-accent/50 p-1'>
                      <p className='px-3 pt-2 pb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase'>
                        Theo chủ đề
                      </p>
                      {categories.map((category) => {
                        const { Icon, gradient } = getCategoryStyle(category)
                        return (
                          <Link
                            key={category.id}
                            href={`/courses?categoryId=${category.id}`}
                            onClick={closeMenu}
                            className='flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-card'
                          >
                            <span
                              className={cn(
                                'flex size-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br text-white',
                                gradient
                              )}
                            >
                              <Icon className='size-4' />
                            </span>
                            <span className='min-w-0 flex-1 truncate text-sm font-medium'>{category.name}</span>
                            <span className='text-xs text-muted-foreground'>{category.courseCount}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function MenuEntry({ link }: { link: MenuLink }) {
  const { Icon } = link
  return (
    <Link
      href={link.href}
      onClick={closeMenu}
      className='group/entry flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-accent'
    >
      <span className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover/entry:bg-primary group-hover/entry:text-primary-foreground'>
        <Icon className='size-4' />
      </span>
      <span className='flex min-w-0 flex-col'>
        <span className='text-sm font-medium'>{link.label}</span>
        {link.description && <span className='text-xs text-muted-foreground'>{link.description}</span>}
      </span>
    </Link>
  )
}
