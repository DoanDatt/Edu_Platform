'use client'

import { useAppContext } from '@/components/app-provider'
import Waves from '@/components/waves'
import { RoleType, RoleValues } from '@/constants/type'
import { cn } from '@/lib/utils'
import { CategoryListItemType } from '@/schemaValidations/category.schema'
import { ArrowRight, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type MenuLink = { label: string; href: string; badge?: string }
type MenuColumn = { title: string; links: MenuLink[] }
type MenuItem = {
  label: string
  href: string // bấm thẳng vào mục thì đi tới đây
  match: string[] // đang ở các đường dẫn này (hoặc trang con) thì tô màu mục
  roles?: RoleType[] // có thì chỉ hiện khi đăng nhập đúng vai trò
  columns?: MenuColumn[] // menu con (các cột link)
}

// Menu "Khóa học" dựng riêng (cần danh sách danh mục từ server) → ở đây chỉ khai báo các menu còn lại
const menuItems: MenuItem[] = [
  { label: 'Trang chủ', href: '/', match: [] },
  { label: 'Khóa học', href: '/courses', match: ['/courses'] },
  {
    label: 'Học tập',
    href: '/my-courses',
    match: ['/my-courses', '/my-orders', '/profile'],
    roles: [RoleValues.Student, RoleValues.Instructor, RoleValues.Admin],
    columns: [
      {
        title: 'Học tập',
        links: [
          { label: 'Khóa học của tôi', href: '/my-courses' },
          { label: 'Lịch sử mua hàng', href: '/my-orders' },
          { label: 'Đơn chờ thanh toán', href: '/my-orders?status=PENDING' }
        ]
      },
      {
        title: 'Tài khoản',
        links: [
          { label: 'Thông tin tài khoản', href: '/profile' },
          { label: 'Đổi mật khẩu', href: '/profile/change-password' }
        ]
      }
    ]
  },
  {
    label: 'Giảng dạy',
    href: '/instructor',
    match: ['/instructor'],
    roles: [RoleValues.Instructor],
    columns: [
      {
        title: 'Giảng dạy',
        links: [
          { label: 'Tổng quan & doanh thu', href: '/instructor' },
          { label: 'Khóa học của tôi', href: '/instructor/courses' },
          { label: 'Tạo khóa học mới', href: '/instructor/courses/new', badge: 'Mới' }
        ]
      }
    ]
  },
  {
    label: 'Quản trị',
    href: '/admin',
    match: ['/admin'],
    roles: [RoleValues.Admin],
    columns: [
      {
        title: 'Quản trị',
        links: [
          { label: 'Dashboard', href: '/admin' },
          { label: 'Duyệt khóa học', href: '/admin/courses?status=PENDING' },
          { label: 'Tất cả khóa học', href: '/admin/courses' },
          { label: 'Danh mục', href: '/admin/categories' },
          { label: 'Người dùng', href: '/admin/users' }
        ]
      }
    ]
  }
]

// Cột "Khám phá" của menu Khóa học: các bộ lọc có sẵn của trang /courses
const exploreLinks: MenuLink[] = [
  { label: 'Tất cả khóa học', href: '/courses' },
  { label: 'Khóa miễn phí', href: '/courses?price=free', badge: 'Free' },
  { label: 'Học nhiều nhất', href: '/courses?sort=popular', badge: 'Hot' },
  { label: 'Mới ra mắt', href: '/courses?sort=newest', badge: 'Mới' },
  { label: 'Khóa có phí', href: '/courses?price=paid' },
  { label: 'Giá từ thấp đến cao', href: '/courses?sort=price_asc' }
]

// Bấm 1 link trong menu con: bỏ focus khỏi link → hết focus-within → menu đóng lại sau khi chuyển trang
// (header không bị tải lại khi chuyển trang trong Next, không bỏ focus thì menu cứ mở mãi)
const closeMenu = () => (document.activeElement as HTMLElement | null)?.blur()

// Tầng dưới của header (máy tính), các mục canh giữa. Rê chuột vào mục có mũi tên → tấm menu xổ xuống.
// Mở bằng CSS (group-hover + group-focus-within), không cần state: Tab bằng bàn phím cũng mở được, rời ra là đóng.
//   "Khóa học": tấm lớn = dải banner (số liệu + ảnh bìa thật) + 2 cột (Khám phá · Theo chủ đề)
//   Học tập / Giảng dạy / Quản trị: tấm nhỏ theo cột, chỉ hiện khi đăng nhập đúng vai trò
export default function MainMenu({ categories }: { categories: CategoryListItemType[] }) {
  const pathname = usePathname()
  const { role } = useAppContext()

  const isActive = (item: MenuItem) =>
    item.match.length === 0
      ? pathname === '/'
      : item.match.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  return (
    <ul className='flex items-center justify-center gap-2'>
      {menuItems.map((item) => {
        if (item.roles && (!role || !item.roles.includes(role))) return null
        const active = isActive(item)
        const isCourses = item.href === '/courses'
        const hasPanel = isCourses || Boolean(item.columns)
        return (
          <li key={item.label} className='group relative'>
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              onClick={closeMenu}
              className={cn(
                'flex h-12 items-center gap-1 px-4 text-[15px] font-medium transition-colors',
                active ? 'text-primary' : 'text-foreground/80 group-hover:text-primary'
              )}
            >
              {item.label}
              {hasPanel && (
                <ChevronDown className='size-4 transition-transform group-focus-within:rotate-180 group-hover:rotate-180' />
              )}
            </Link>

            {hasPanel && (
              // Tấm menu canh giữa dưới mục. invisible (không phải hidden): giữ chỗ để hiệu ứng mờ dần + trượt
              // xuống chạy được, nhưng khi đóng thì không bấm / Tab vào được
              <div className='invisible absolute top-full left-1/2 z-50 -translate-x-1/2 translate-y-2 pt-1 opacity-0 transition-all duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100'>
                <div className='overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl shadow-sky-900/15'>
                  {isCourses ? (
                    <CoursesPanel categories={categories} />
                  ) : (
                    <div className={cn('grid gap-8 p-7', item.columns!.length > 1 ? 'w-[34rem] grid-cols-2' : 'w-72')}>
                      {item.columns!.map((column) => (
                        <MenuColumnList key={column.title} column={column} />
                      ))}
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

// Tấm menu lớn của "Khóa học"
function CoursesPanel({ categories }: { categories: CategoryListItemType[] }) {
  // Số khóa đã xuất bản = cộng số khóa các danh mục (mỗi khóa thuộc đúng 1 danh mục)
  const totalCourses = categories.reduce((sum, category) => sum + category.courseCount, 0)
  // Ảnh minh họa ở dải banner: ảnh bìa THẬT của khóa nổi bật (danh mục đầu tiên có ảnh)
  const featuredImage = categories.find((category) => category.coverImage)?.coverImage

  return (
    <div className='w-[52rem]'>
      {/* Dải banner: gradient thương hiệu + sóng, chữ trái, ảnh bìa phải */}
      <Link
        href='/courses'
        onClick={closeMenu}
        className='group/banner relative flex h-40 items-center justify-between overflow-hidden bg-linear-to-br from-sky-500 via-sky-600 to-blue-800 px-8 text-white'
      >
        <div aria-hidden className='absolute -top-16 left-1/3 size-56 rounded-full bg-white/15 blur-2xl' />
        <Waves className='h-1/3' />
        <div className='relative flex max-w-sm flex-col gap-1.5'>
          <p className='font-heading text-xl font-semibold'>Thư viện khóa học</p>
          <p className='text-sm text-white/85'>
            {totalCourses > 0
              ? `${totalCourses} khóa học thuộc ${categories.length} chủ đề, từ cơ bản đến nâng cao.`
              : 'Khóa học từ cơ bản đến nâng cao, học theo tốc độ của bạn.'}
          </p>
          <span className='mt-1 flex items-center gap-1 text-sm font-semibold'>
            Khám phá ngay <ArrowRight className='size-4 transition-transform group-hover/banner:translate-x-1' />
          </span>
        </div>
        {featuredImage && (
          <div className='relative hidden h-32 w-56 -rotate-3 overflow-hidden rounded-xl border-4 border-white/30 shadow-2xl transition-transform duration-300 group-hover/banner:rotate-0 sm:block'>
            <Image src={featuredImage} alt='' fill sizes='224px' className='object-cover' />
          </div>
        )}
      </Link>

      <div className='grid grid-cols-2 gap-10 p-8'>
        <MenuColumnList column={{ title: 'Khám phá', links: exploreLinks }} />
        <MenuColumnList
          column={{
            title: 'Theo chủ đề',
            links: categories.map((category) => ({
              label: category.name,
              href: `/courses?categoryId=${category.id}`,
              badge: `${category.courseCount} khóa`
            }))
          }}
        />
      </div>
    </div>
  )
}

// 1 cột link: tiêu đề in hoa nhạt + gạch dưới, các link chữ (rê chuột: đổi màu + nhích sang phải), nhãn nhỏ bên cạnh
function MenuColumnList({ column }: { column: MenuColumn }) {
  return (
    <div className='flex flex-col'>
      <p className='border-b pb-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase'>
        {column.title}
      </p>
      <ul className='mt-2 flex flex-col'>
        {column.links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={closeMenu}
              className='flex items-center gap-2 py-2 text-[15px] text-foreground/80 transition-all hover:translate-x-1 hover:text-primary'
            >
              <span className='truncate'>{link.label}</span>
              {link.badge && (
                <span className='shrink-0 rounded-full bg-highlight/10 px-2 py-0.5 text-[11px] font-semibold text-highlight'>
                  {link.badge}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
