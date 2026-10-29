import DashboardShell from '@/components/dashboard/dashboard-shell'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Quản trị',
    template: '%s | Quản trị EduPlatform' // trang con đặt title 'Người dùng' → "Người dùng | Quản trị EduPlatform"
  },
  robots: { index: false } // trang quản trị không cho Google đưa lên kết quả tìm kiếm
}

// Chỉ admin vào được: proxy.ts đã chặn trước khi tới đây (sai role → về trang chủ)
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell menu='admin' title='Quản trị'>
      {children}
    </DashboardShell>
  )
}
