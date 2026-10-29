'use client'

import { useAppContext } from '@/components/app-provider'
import { RoleType, RoleValues } from '@/constants/type'
import { cn } from '@/lib/utils'
import { BookOpen, GraduationCap, House, Info, LucideIcon, Newspaper, Presentation, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Cách đọc:
//   không có role → ai cũng thấy
//   role          → chỉ hiện khi đã đăng nhập VÀ role nằm trong danh sách
// Đăng nhập / Đăng ký không nằm ở đây: đã chuyển thành nút ở góc phải header (AuthButtons)
const menuItems: {
  title: string
  href: string
  Icon: LucideIcon
  role?: RoleType[]
}[] = [
  { title: 'Trang chủ', href: '/', Icon: House },
  // Danh mục khóa học công khai: tìm kiếm, lọc (GET /courses)
  { title: 'Khóa học', href: '/courses', Icon: BookOpen },
  {
    // Khóa đã ghi danh + tiến độ. Giảng viên và admin cũng ghi danh học được nên cũng thấy
    title: 'Khóa của tôi',
    href: '/my-courses',
    Icon: GraduationCap,
    role: [RoleValues.Student, RoleValues.Instructor, RoleValues.Admin]
  },
  { title: 'Giảng dạy', href: '/instructor', Icon: Presentation, role: [RoleValues.Instructor] },
  { title: 'Quản trị', href: '/admin', Icon: ShieldCheck, role: [RoleValues.Admin] },
  { title: 'Blog', href: '/blog', Icon: Newspaper },
  { title: 'Giới thiệu', href: '/about', Icon: Info }
]

// Danh sách dọc trong menu trượt (điện thoại / tablet, dưới lg), icon bên trái chữ.
// Máy tính dùng menu tầng dưới của header (MainMenu) thay cho danh sách này.
// Server: chỉ các mục không cần role (server không biết trạng thái đăng nhập).
// Client: ngay sau đó AppProvider đọc token → hiện thêm mục theo role
export default function NavItems() {
  const pathname = usePathname()
  const { role } = useAppContext()

  return menuItems.map(({ title, href, Icon, role: allowedRoles }) => {
    // Mục theo role: chưa đăng nhập, hoặc role không nằm trong danh sách → ẩn
    if (allowedRoles && (!role || !allowedRoles.includes(role))) return null

    // Đang ở đúng trang đó (hoặc trang con của nó) thì tô nổi.
    // '/' phải so sánh bằng, không thì trang nào cũng bắt đầu bằng '/'
    const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)

    return (
      <Link
        key={href}
        href={href}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-base transition-colors',
          isActive ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
        )}
      >
        <Icon className={cn('size-4', isActive && 'text-primary')} />
        {title}
      </Link>
    )
  })
}
