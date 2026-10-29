import DashboardShell from '@/components/dashboard/dashboard-shell'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Giảng dạy',
    template: '%s | Giảng dạy EduPlatform' // trang con đặt title 'Khóa học của tôi' → "Khóa học của tôi | Giảng dạy EduPlatform"
  },
  robots: { index: false } // trang riêng của giảng viên, không cho Google đưa lên kết quả tìm kiếm
}

// Chỉ giảng viên vào được: proxy.ts đã chặn (chưa đăng nhập → /login, sai role → trang chủ)
export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell menu='instructor' title='Giảng dạy'>
      {children}
    </DashboardShell>
  )
}
