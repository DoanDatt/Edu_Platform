import type { Metadata } from 'next'
import LoginForm from './form-login'

export const metadata: Metadata = {
  title: 'Đăng nhập' // → "Đăng nhập | EduPlatform" (template ở root layout)
}

export default function LoginPage() {
  return (
    <div className='flex flex-1 items-center justify-center py-8'>
      <LoginForm />
    </div>
  )
}
