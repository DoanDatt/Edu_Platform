import type { Metadata } from 'next'
import AuthShell from '../auth-shell'
import LoginForm from './form-login'

export const metadata: Metadata = {
  title: 'Đăng nhập' // → "Đăng nhập | EduPlatform" (template ở root layout)
}

export default function LoginPage() {
  return (
    <AuthShell title='Chào mừng bạn quay lại!' description='Đăng nhập để tiếp tục các khóa học đang dang dở.'>
      <LoginForm />
    </AuthShell>
  )
}
