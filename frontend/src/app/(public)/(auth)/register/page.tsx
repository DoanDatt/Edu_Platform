import type { Metadata } from 'next'
import RegisterForm from './form-register'

export const metadata: Metadata = {
  title: 'Đăng ký' // → "Đăng ký | EduPlatform" (template ở root layout)
}

export default function RegisterPage() {
  return (
    <div className='flex flex-1 items-center justify-center py-8'>
      <RegisterForm />
    </div>
  )
}
