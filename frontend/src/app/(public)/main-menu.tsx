'use client'

import { useAppContext } from '@/components/app-provider'
import Waves from '@/components/waves'
import { RoleType, RoleValues } from '@/constants/type'
import { cn } from '@/lib/utils'
import { CategoryListItemType } from '@/schemaValidations/category.schema'
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Lock,
  LucideIcon,
  Presentation,
  ShieldCheck
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type MenuLink = { label: string; href: string; badge?: string; locked?: boolean }
type MenuColumn = { title: string; links: MenuLink[] }
type MenuItem = {
  label: string
  href: string // bấm thẳng vào mục thì đi tới đây
  match: string[] // đang ở các đường dẫn này (hoặc trang con) thì tô màu mục
  panel?: 'courses' | 'dashboard' // loại tấm menu xổ xuống
}

const menuItems: MenuItem[] = [
  { label: 'Trang chủ', href: '/', match: [] },
  { label: 'Khóa học', href: '/courses', match: ['/courses'], panel: 'courses' },
  {
    label: 'Dashboard',
    // Chưa đăng nhập: proxy tự chuyển /my-courses về /login
    href: '/my-courses',
    match: ['/my-courses', '/my-orders', '/profile', '/instructor', '/admin'],
    panel: 'dashboard'
  }
]

// Menu "Dashboard": mỗi vai trò 1 mục, rê vào mục nào thì tấm thứ 2 bung sang phải với các trang của vai trò đó.
//   Đã đăng nhập: chỉ hiện vai trò người dùng có — ai cũng là học viên (mua / học được khóa của người khác),
//     giảng viên có thêm "Giảng viên", admin có thêm "Quản trị"
//   Chưa đăng nhập: hiện các vai trò có forGuest (Học viên, Giảng viên) để người mới biết bên trong có gì,
//     mọi link dẫn tới trang đăng nhập + nút Đăng nhập / Đăng ký
type DashboardSection = {
  label: string
  description: string
  Icon: LucideIcon
  roles: RoleType[]
  forGuest?: boolean
  guestNote?: string // dòng chú thích ở tấm con khi chưa đăng nhập
  links: MenuLink[]
}

const dashboardSections: DashboardSection[] = [
  {
    label: 'Học viên',
    description: 'Khóa học, đơn hàng, tài khoản',
    Icon: GraduationCap,
    roles: [RoleValues.Student, RoleValues.Instructor, RoleValues.Admin],
    forGuest: true,
    guestNote: 'Đăng ký miễn phí để học và theo dõi tiến độ.',
    links: [
      { label: 'Khóa học của tôi', href: '/my-courses' },
      { label: 'Lịch sử mua hàng', href: '/my-orders' },
      { label: 'Đơn chờ thanh toán', href: '/my-orders?status=PENDING' },
      { label: 'Thông tin tài khoản', href: '/profile' },
      { label: 'Đổi mật khẩu', href: '/profile/change-password' }
    ]
  },
  {
    label: 'Giảng viên',
    description: 'Soạn khóa học, học viên, doanh thu',
    Icon: Presentation,
    roles: [RoleValues.Instructor],
    forGuest: true,
    // Không có trang "đăng ký làm giảng viên": tài khoản giảng viên do quản trị viên cấp quyền
    guestNote: 'Dành cho tài khoản giảng viên (do quản trị viên cấp quyền).',
    links: [
      { label: 'Tổng quan & doanh thu', href: '/instructor' },
      { label: 'Khóa học của tôi', href: '/instructor/courses' },
      { label: 'Tạo khóa học mới', href: '/instructor/courses/new', badge: 'Mới' }
    ]
  },
  {
    label: 'Quản trị',
    description: 'Duyệt khóa, danh mục, người dùng',
    Icon: ShieldCheck,
    roles: [RoleValues.Admin],
    links: [
      { label: 'Dashboard', href: '/admin' },
      { label: 'Duyệt khóa học', href: '/admin/courses?status=PENDING' },
      { label: 'Tất cả khóa học', href: '/admin/courses' },
      { label: 'Danh mục', href: '/admin/categories' },
      { label: 'Người dùng', href: '/admin/users' }
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
//   "Dashboard": danh sách vai trò, rê vào vai trò → tấm thứ 2 bung sang phải (chưa đăng nhập: dẫn tới đăng nhập)
export default function MainMenu({ categories }: { categories: CategoryListItemType[] }) {
  const pathname = usePathname()
  const { role } = useAppContext()

  const isActive = (item: MenuItem) =>
    item.match.length === 0
      ? pathname === '/'
      : item.match.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  // Đã đăng nhập: vai trò người dùng có. Chưa đăng nhập: các vai trò giới thiệu cho khách (forGuest)
  const sections = dashboardSections.filter((section) => (role ? section.roles.includes(role) : section.forGuest))

  return (
    <ul className='flex items-center justify-center gap-2'>
      {menuItems.map((item) => {
        const active = isActive(item)
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
              {item.panel && (
                <ChevronDown className='size-4 transition-transform group-focus-within:rotate-180 group-hover:rotate-180' />
              )}
            </Link>

            {item.panel && (
              // Tấm menu dưới mục. invisible (không phải hidden): giữ chỗ để hiệu ứng mờ dần + trượt xuống chạy được,
              // nhưng khi đóng thì không bấm / Tab vào được
              <div
                className={cn(
                  'invisible absolute top-full z-50 translate-y-2 pt-1 opacity-0 transition-all duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100',
                  // Khóa học: canh giữa dưới mục. Dashboard: canh trái (tấm thứ 2 bung sang phải cần chỗ)
                  item.panel === 'courses' ? 'left-1/2 -translate-x-1/2' : 'left-0'
                )}
              >
                {item.panel === 'courses' ? (
                  <div className='overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl shadow-sky-900/15'>
                    <CoursesPanel categories={categories} />
                  </div>
                ) : (
                  <DashboardPanel sections={sections} isGuest={!role} />
                )}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

// Tấm "Dashboard": cột trái là các vai trò. Mỗi vai trò là 1 group/sub: rê vào (hoặc Tab tới) → tấm con bên phải hiện.
// Không dùng overflow-hidden ở tấm ngoài: tấm con nằm NGOÀI khung tấm ngoài, bị cắt mất nếu có.
// isGuest (chưa đăng nhập): mọi link dẫn tới /login, các trang hiện ổ khóa, cuối tấm con có nút Đăng nhập / Đăng ký
function DashboardPanel({ sections, isGuest }: { sections: DashboardSection[]; isGuest: boolean }) {
  return (
    <ul className='w-80 rounded-2xl border bg-popover p-2 text-popover-foreground shadow-2xl shadow-sky-900/15'>
      {sections.map(({ label, description, Icon, links, guestNote }) => (
        <li key={label} className='group/sub relative'>
          <Link
            href={isGuest ? '/login' : links[0].href}
            onClick={closeMenu}
            className='flex items-center gap-3 rounded-xl px-3 py-3 transition-colors group-focus-within/sub:bg-accent group-hover/sub:bg-accent'
          >
            <span className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover/sub:bg-primary group-hover/sub:text-primary-foreground'>
              <Icon className='size-5' />
            </span>
            <span className='flex min-w-0 flex-1 flex-col'>
              <span className='font-medium transition-colors group-hover/sub:text-primary'>Dashboard {label}</span>
              <span className='truncate text-xs text-muted-foreground'>{description}</span>
            </span>
            <ChevronRight className='size-4 text-muted-foreground transition-transform group-hover/sub:translate-x-0.5' />
          </Link>
          {/* Tấm con bung sang phải, ngang hàng với mục đang rê. pl-3: cầu nối vô hình để rê chuột sang không bị đóng */}
          <div className='invisible absolute top-0 left-full z-10 -translate-x-1 pl-3 opacity-0 transition-all duration-200 group-focus-within/sub:visible group-focus-within/sub:translate-x-0 group-focus-within/sub:opacity-100 group-hover/sub:visible group-hover/sub:translate-x-0 group-hover/sub:opacity-100'>
            <div className='w-72 rounded-2xl border bg-popover p-5 shadow-2xl shadow-sky-900/15'>
              <MenuColumnList
                column={{
                  title: label,
                  links: isGuest ? links.map((link) => ({ ...link, href: '/login', locked: true })) : links
                }}
              />
              {isGuest && (
                <div className='mt-3 flex flex-col gap-3 border-t pt-4'>
                  {guestNote && <p className='text-xs text-muted-foreground'>{guestNote}</p>}
                  <div className='flex gap-2'>
                    <Link
                      href='/login'
                      onClick={closeMenu}
                      className='flex-1 rounded-full bg-linear-to-r from-sky-500 to-blue-600 py-2 text-center text-sm font-semibold text-white shadow-md shadow-sky-500/25 transition-opacity hover:opacity-90'
                    >
                      Đăng nhập
                    </Link>
                    <Link
                      href='/register'
                      onClick={closeMenu}
                      className='flex-1 rounded-full border py-2 text-center text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary'
                    >
                      Đăng ký
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </li>
      ))}
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
    <div className='w-208'>
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
        {/* key = label: khi chưa đăng nhập mọi link đều trỏ /login → href bị trùng, không dùng làm key được */}
        {column.links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              onClick={closeMenu}
              className='flex items-center gap-2 py-2 text-[15px] text-foreground/80 transition-all hover:translate-x-1 hover:text-primary'
            >
              {link.locked && <Lock aria-hidden className='size-3.5 shrink-0 text-muted-foreground' />}
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
