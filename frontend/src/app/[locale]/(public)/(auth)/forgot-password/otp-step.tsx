'use client'

import { Button } from '@/components/ui/button'
import { CardContent, CardFooter } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useZodErrorTranslator } from '@/i18n/zod-errors'
import { handleErrorApi } from '@/lib/utils'
import { useForgotPasswordMutation, useVerifyOtpMutation } from '@/queries/useAuth'
import { VerifyOtpFormSchema, VerifyOtpFormType } from '@/schemaValidations/auth.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

// Backend chỉ gửi mã mới sau 60 giây (gửi sớm hơn vẫn trả 200 nhưng không có email) → khóa nút đúng 60 giây
const RESEND_SECONDS = 60

// Bước 2: nhập mã. Đúng mới được sang bước đặt mật khẩu mới
export default function OtpStep({
  email,
  onVerified,
  onChangeEmail
}: {
  email: string
  onVerified: (code: string) => void
  onChangeEmail: () => void
}) {
  const t = useTranslations('ForgotPassword')
  const translateError = useZodErrorTranslator()
  const verifyOtpMutation = useVerifyOtpMutation()
  const forgotPasswordMutation = useForgotPasswordMutation()
  // Vào bước này là mã vừa được gửi → đếm ngược luôn
  const [countdown, setCountdown] = useState(RESEND_SECONDS)

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const form = useForm<VerifyOtpFormType>({
    resolver: zodResolver(VerifyOtpFormSchema),
    defaultValues: { code: '' }
  })

  const onSubmit = async ({ code }: VerifyOtpFormType) => {
    if (verifyOtpMutation.isPending) return
    try {
      await verifyOtpMutation.mutateAsync({ email, code })
      onVerified(code)
    } catch (error) {
      // 422: sai / hết hạn → hiện ngay dưới ô mã (field: code) · 429 nhập quá nhiều lần: toast
      handleErrorApi({ error, setError: form.setError })
    }
  }

  const resendCode = async () => {
    if (countdown > 0 || forgotPasswordMutation.isPending) return
    try {
      await forgotPasswordMutation.mutateAsync({ email })
      toast.success(t('codeSent'))
      form.reset() // mã cũ đã bị thay → xóa ô mã và lỗi cũ
      setCountdown(RESEND_SECONDS)
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  return (
    <>
      <CardContent>
        <form id='form-forgot-otp' noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name='code'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='forgot-otp'>{t('otpLabel')}</FieldLabel>
                  {/* inputMode numeric: điện thoại mở bàn phím số
                      one-time-code: điện thoại gợi ý điền mã từ thông báo email / tin nhắn */}
                  <Input
                    {...field}
                    // Chỉ giữ chữ số rồi mới cắt 6 ký tự: dán "123 456" vẫn đủ 6 số.
                    // Không dùng maxLength: trình duyệt cắt TRƯỚC khi lọc → "123 456" còn "123 45"
                    onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    id='forgot-otp'
                    inputMode='numeric'
                    autoComplete='one-time-code'
                    placeholder='••••••'
                    autoFocus
                    aria-invalid={fieldState.invalid}
                    className='h-12 text-center font-mono text-2xl tracking-[0.5em]'
                  />
                  {fieldState.invalid && <FieldError errors={[translateError(fieldState.error)]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter className='flex flex-col gap-4'>
        <Button type='submit' form='form-forgot-otp' className='w-full' disabled={verifyOtpMutation.isPending}>
          {verifyOtpMutation.isPending && <Loader2 className='animate-spin' />}
          {t('verify')}
        </Button>
        <div className='flex w-full items-center justify-between text-sm'>
          <Button type='button' variant='link' className='h-auto p-0 text-muted-foreground' onClick={onChangeEmail}>
            {t('changeEmail')}
          </Button>
          <Button
            type='button'
            variant='link'
            className='h-auto p-0'
            onClick={resendCode}
            disabled={countdown > 0 || forgotPasswordMutation.isPending}
          >
            {forgotPasswordMutation.isPending && <Loader2 className='animate-spin' />}
            {countdown > 0 ? t('resendIn', { seconds: countdown }) : t('resend')}
          </Button>
        </div>
      </CardFooter>
    </>
  )
}
