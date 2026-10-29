import type { Metadata } from 'next'
import AuthShell from '../auth-shell'
import RegisterForm from './form-register'

export const metadata: Metadata = {
  title: 'Đăng ký' // → "Đăng ký | EduPlatform" (template ở root layout)
}

export default function RegisterPage() {
  return (
    <AuthShell
      title='Bắt đầu hành trình học của bạn'
      description='Tạo tài khoản miễn phí, ghi danh khóa học và theo dõi tiến độ ngay hôm nay.'
    >
      <RegisterForm />
    </AuthShell>
  )
}
