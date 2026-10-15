import { BookOpen, FolderTree, LayoutDashboard, ShieldCheck, Users } from 'lucide-react'

// Các mục trong sidebar khu quản trị. Thêm trang admin mới thì thêm 1 dòng ở đây
const adminMenuItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    Icon: LayoutDashboard // GET /stats/admin
  },
  {
    title: 'Khóa học',
    href: '/admin/courses',
    Icon: BookOpen // duyệt / từ chối / gỡ khóa học
  },
  {
    title: 'Danh mục',
    href: '/admin/categories',
    Icon: FolderTree
  },
  {
    title: 'Người dùng',
    href: '/admin/users',
    Icon: Users // khóa / mở tài khoản, đổi role
  },
  {
    title: 'Phân quyền',
    href: '/admin/roles',
    Icon: ShieldCheck // role + permission
  }
]

export default adminMenuItems
