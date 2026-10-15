'use client'

import { useAppContext } from '@/components/app-provider'
import { RoleType, RoleValues } from '@/constants/type'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Cách đọc:
//   không có role, không có hideWhenLogin → ai cũng thấy
//   role                                   → chỉ hiện khi đã đăng nhập VÀ role nằm trong danh sách
//   hideWhenLogin: true                    → chỉ hiện khi CHƯA đăng nhập
const menuItems: {
  title: string
  href: string
  role?: RoleType[]
  hideWhenLogin?: boolean
}[] = [
  {
    title: 'Trang chủ',
    href: '/'
  },
  {
    // Danh mục khóa học công khai: tìm kiếm, lọc (GET /courses)
    title: 'Khóa học',
    href: '/courses'
  },
  {
    // Khóa đã ghi danh + tiến độ (GET /enrollments/mine)
    // Giảng viên và admin cũng ghi danh học được nên cũng thấy
    title: 'Khóa học của tôi',
    href: '/my-courses',
    role: [RoleValues.Student, RoleValues.Instructor, RoleValues.Admin]
  },
  {
    // Quản lý khóa mình dạy, soạn chương / bài, gửi duyệt (GET /courses/mine)
    title: 'Giảng dạy',
    href: '/instructor/courses',
    role: [RoleValues.Instructor]
  },
  {
    // Duyệt khóa học, danh mục, phân quyền (GET /courses/pending...)
    title: 'Quản trị',
    href: '/admin/courses',
    role: [RoleValues.Admin]
  },
  {
    title: 'Đăng nhập',
    href: '/login',
    hideWhenLogin: true
  },
  {
    title: 'Đăng ký',
    href: '/register',
    hideWhenLogin: true
  }
]

// Server: Trang chủ, Khóa học, Đăng nhập, Đăng ký. Do server không biết trạng thái đăng nhập
// Client: lúc đầu hiển thị giống server, ngay sau đó AppProvider đọc token → hiện đúng menu theo role
export default function NavItems({ className }: { className?: string }) {
  const pathname = usePathname()
  const { role, isAuth } = useAppContext()

  return menuItems.map((item) => {
    // Đã đăng nhập thì ẩn Đăng nhập / Đăng ký
    if (item.hideWhenLogin && isAuth) return null
    // Mục theo role: chưa đăng nhập, hoặc role không nằm trong danh sách → ẩn
    if (item.role && (!role || !item.role.includes(role))) return null

    // Đang ở đúng trang đó (hoặc trang con của nó) thì tô đậm
    // '/' phải so sánh bằng, không thì trang nào cũng bắt đầu bằng '/'
    const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(className, isActive ? 'font-semibold text-foreground' : 'text-muted-foreground')}
      >
        {item.title}
      </Link>
    )
  })
}
