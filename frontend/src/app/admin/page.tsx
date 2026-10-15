import type { Metadata } from 'next'

export const metadata: Metadata = {
  // title.template của admin/layout chỉ áp dụng cho trang CON (/admin/users...),
  // trang /admin nằm cùng cấp với layout nên phải ghi đầy đủ bằng absolute
  title: { absolute: 'Dashboard | Quản trị EduPlatform' }
}

// Trang tạm để thấy layout. Ngày 17 (docs/study-plan.md): thống kê từ GET /stats/admin
export default function AdminDashboardPage() {
  return (
    <div className='space-y-1'>
      <h1 className='text-2xl font-semibold tracking-tight'>Dashboard</h1>
      <p className='text-muted-foreground'>Tổng quan hệ thống sẽ hiển thị ở đây.</p>
    </div>
  )
}
