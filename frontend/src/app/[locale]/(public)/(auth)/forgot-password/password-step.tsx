'use client'

import { Button } from '@/components/ui/button'
import { CardContent, CardFooter } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useRouter } from '@/i18n/navigation'
import { useZodErrorTranslator } from '@/i18n/zod-errors'
import { EntityError } from '@/lib/http'
import { handleErrorApi } from '@/lib/utils'
import { useResetPasswordMutation } from '@/queries/useAuth'
import { ResetPasswordFormSchema, ResetPasswordFormType } from '@/schemaValidations/auth.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

// Bước 3: mật khẩu mới. Gửi kèm email + mã của 2 bước trước (backend kiểm tra mã lần nữa)
export default function PasswordStep({
  email,
  code,
  onCodeExpired
}: {
  email: string
  code: string
  onCodeExpired: () => void
}) {
  const t = useTranslations('ForgotPassword')
  const tAuth = useTranslations('Auth')
  const translateError = useZodErrorTranslator()
  const resetPasswordMutation = useResetPasswordMutation()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<ResetPasswordFormType>({
    resolver: zodResolver(ResetPasswordFormSchema),
    defaultValues: { newPassword: '', confirmPassword: '' }
  })

  const onSubmit = async (data: ResetPasswordFormType) => {
    if (resetPasswordMutation.isPending) return
    try {
      await resetPasswordMutation.mutateAsync({ ...data, email, code })
      toast.success(t('resetSuccess'))
      router.push('/login')
    } catch (error) {
      // Lỗi ở ô code: form này không có ô code để gắn lỗi (handleErrorApi sẽ "gắn" vào ô không tồn tại,
      // người dùng không thấy gì) → tự bắt: mã hết hạn trong lúc đang gõ, quay về xin mã mới
      if (error instanceof EntityError && error.payload.errors.some((item) => item.field === 'code')) {
        toast.error(t('codeExpired'))
        onCodeExpired()
        return
      }
      // 422 ô mật khẩu: gắn vào đúng ô · 429, lỗi khác: toast
      handleErrorApi({ error, setError: form.setError })
    }
  }

  return (
    <>
      <CardContent>
        <form id='form-forgot-password' noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name='newPassword'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='forgot-new-password'>{t('newPassword')}</FieldLabel>
                  <div className='relative'>
                    {/* new-password: trình duyệt gợi ý mật khẩu mạnh và lưu đúng mật khẩu mới */}
                    <Input
                      {...field}
                      id='forgot-new-password'
                      type={showPassword ? 'text' : 'password'}
                      placeholder={tAuth('passwordPlaceholder')}
                      autoComplete='new-password'
                      autoFocus
                      aria-invalid={fieldState.invalid}
                      className='pr-9'
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword((prev) => !prev)}
                      className='absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground'
                      aria-label={showPassword ? tAuth('hidePassword') : tAuth('showPassword')}
                    >
                      {showPassword ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
                    </button>
                  </div>
                  {fieldState.invalid && <FieldError errors={[translateError(fieldState.error)]} />}
                </Field>
              )}
            />

            <Controller
              name='confirmPassword'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='forgot-confirm-password'>{tAuth('confirmPassword')}</FieldLabel>
                  {/* Dùng chung showPassword với ô trên: bấm 👁 là hiện cả 2 ô */}
                  <Input
                    {...field}
                    id='forgot-confirm-password'
                    type={showPassword ? 'text' : 'password'}
                    placeholder={tAuth('confirmPassword')}
                    autoComplete='new-password'
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[translateError(fieldState.error)]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter>
        <Button type='submit' form='form-forgot-password' className='w-full' disabled={resetPasswordMutation.isPending}>
          {resetPasswordMutation.isPending && <Loader2 className='animate-spin' />}
          {t('submit')}
        </Button>
      </CardFooter>
    </>
  )
}
