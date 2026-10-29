import type { Metadata } from 'next'
import AdminDashboard from './admin-dashboard'

export const metadata: Metadata = {
  // title.template của admin/layout chỉ áp dụng cho trang CON (/admin/users...),
  // trang /admin nằm cùng cấp với layout nên phải ghi đầy đủ bằng absolute
  title: { absolute: 'Dashboard | Quản trị EduPlatform' }
}

// Tổng quan hệ thống: số liệu từ GET /stats/admin + khóa chờ duyệt (việc admin cần làm ngay)
export default function AdminDashboardPage() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>Dashboard</h1>
        <p className='text-muted-foreground'>Tổng quan người dùng, khóa học và việc cần xử lý.</p>
      </div>
      {/* Client Component + useQuery: số liệu riêng của admin (cần token), không cần SEO */}
      <AdminDashboard />
    </div>
  )
}
