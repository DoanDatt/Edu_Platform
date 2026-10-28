import { BookOpen, FolderTree, LayoutDashboard, LucideIcon, Users } from 'lucide-react'

export type DashboardMenuItem = { title: string; href: string; Icon: LucideIcon }

// Menu sidebar của từng khu. Thêm trang mới thì thêm 1 dòng ở đây.
// Layout (Server Component) chỉ truyền TÊN khu ('admin' | 'instructor') cho thanh menu (Client Component),
// vì Next.js không cho truyền hàm (ở đây là component icon) từ Server sang Client qua props
export const dashboardMenus = {
  admin: {
    rootHref: '/admin',
    items: [
      { title: 'Dashboard', href: '/admin', Icon: LayoutDashboard }, // GET /stats/admin
      { title: 'Khóa học', href: '/admin/courses', Icon: BookOpen }, // duyệt / từ chối / gỡ khóa học
      { title: 'Danh mục', href: '/admin/categories', Icon: FolderTree },
      { title: 'Người dùng', href: '/admin/users', Icon: Users } // khóa / mở tài khoản, đổi role
      // Tạm ẩn: trang /admin/roles chưa làm (bấm vào sẽ ra 404). Làm xong trang Phân quyền thì mở lại:
      // { title: 'Phân quyền', href: '/admin/roles', Icon: ShieldCheck } // role + permission
    ]
  },
  instructor: {
    rootHref: '/instructor',
    items: [
      { title: 'Tổng quan', href: '/instructor', Icon: LayoutDashboard }, // GET /stats/instructor
      { title: 'Khóa học của tôi', href: '/instructor/courses', Icon: BookOpen } // tạo, soạn, gửi duyệt
    ]
  }
} satisfies Record<string, { rootHref: string; items: DashboardMenuItem[] }>

export type DashboardMenuName = keyof typeof dashboardMenus
