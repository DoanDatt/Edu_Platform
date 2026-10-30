'use client'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import EmailStep from './email-step'
import OtpStep from './otp-step'
import PasswordStep from './password-step'

// 3 bước trên cùng 1 trang. Email và mã chỉ nằm trong state (không lên URL),
// tải lại trang là làm lại từ đầu (mã cũ vẫn dùng được nếu chưa hết 10 phút)
const steps = ['email', 'otp', 'password'] as const
type Step = (typeof steps)[number]

export default function ForgotPasswordFlow() {
  const t = useTranslations('ForgotPassword')
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const current = steps.indexOf(step)

  return (
    <div className='flex w-full max-w-sm flex-col items-center gap-4'>
      {/* Hiện dần + trượt từ dưới lên khi mở trang */}
      <Card className='w-full animate-in fade-in slide-in-from-bottom-4 duration-300 motion-reduce:animate-none'>
        <CardHeader className='text-center'>
          {/* Thanh 3 đoạn: đoạn nào đã qua / đang ở thì tô màu */}
          <div className='mb-2 flex gap-1.5' aria-label={t('step', { current: current + 1, total: steps.length })}>
            {steps.map((s, index) => (
              <span
                key={s}
                className={cn('h-1 flex-1 rounded-full transition-colors', index <= current ? 'bg-primary' : 'bg-muted')}
              />
            ))}
          </div>
          <CardTitle className='text-2xl'>{t(`${step}Title`)}</CardTitle>
          <CardDescription>{t(`${step}Description`, { email })}</CardDescription>
        </CardHeader>

        {/* key={step}: đổi bước là React tạo form mới → ô trống + chạy lại hiệu ứng trượt vào */}
        <div key={step} className='flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300 motion-reduce:animate-none'>
          {step === 'email' && (
            <EmailStep
              defaultEmail={email}
              onSent={(sentEmail) => {
                setEmail(sentEmail)
                setStep('otp')
              }}
            />
          )}
          {step === 'otp' && (
            <OtpStep
              email={email}
              onVerified={(verifiedCode) => {
                setCode(verifiedCode)
                setStep('password')
              }}
              onChangeEmail={() => setStep('email')}
            />
          )}
          {step === 'password' && (
            <PasswordStep
              email={email}
              code={code}
              // Mã hết hạn trong lúc đang gõ mật khẩu → quay về xin mã mới
              onCodeExpired={() => {
                setCode('')
                setStep('email')
              }}
            />
          )}
        </div>
      </Card>

      <p className='text-sm text-muted-foreground'>
        {t('rememberPassword')}{' '}
        <Link href='/login' className='font-medium text-foreground underline-offset-4 hover:underline'>
          {t('backToLogin')}
        </Link>
      </p>
    </div>
  )
}
