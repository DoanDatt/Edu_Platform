'use client'

import { Button } from '@/components/ui/button'
import { CardContent, CardFooter } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useZodErrorTranslator } from '@/i18n/zod-errors'
import { handleErrorApi } from '@/lib/utils'
import { useForgotPasswordMutation } from '@/queries/useAuth'
import { ForgotPasswordBodySchema, ForgotPasswordBodyType } from '@/schemaValidations/auth.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

// Bước 1: nhập email → backend gửi mã 6 số
export default function EmailStep({
  defaultEmail,
  onSent
}: {
  defaultEmail: string // quay lại từ bước 2 ("Đổi email") thì điền sẵn email cũ
  onSent: (email: string) => void
}) {
  const t = useTranslations('ForgotPassword')
  const tAuth = useTranslations('Auth')
  const translateError = useZodErrorTranslator()
  const forgotPasswordMutation = useForgotPasswordMutation()

  const form = useForm<ForgotPasswordBodyType>({
    resolver: zodResolver(ForgotPasswordBodySchema),
    defaultValues: { email: defaultEmail }
  })

  const onSubmit = async (data: ForgotPasswordBodyType) => {
    if (forgotPasswordMutation.isPending) return
    try {
      // Backend luôn trả 200 dù email có tồn tại hay không (không cho dò email) → luôn sang bước 2
      await forgotPasswordMutation.mutateAsync(data)
      toast.success(t('codeSent'))
      onSent(data.email)
    } catch (error) {
      // 422: email sai định dạng · 429 xin mã quá nhiều lần, 503 hệ thống email lỗi: toast
      handleErrorApi({ error, setError: form.setError })
    }
  }

  return (
    <>
      <CardContent>
        <form id='form-forgot-email' noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name='email'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='forgot-email'>Email</FieldLabel>
                  <Input
                    {...field}
                    id='forgot-email'
                    type='email'
                    placeholder={tAuth('emailPlaceholder')}
                    autoComplete='email'
                    autoFocus
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
        <Button type='submit' form='form-forgot-email' className='w-full' disabled={forgotPasswordMutation.isPending}>
          {forgotPasswordMutation.isPending && <Loader2 className='animate-spin' />}
          {t('sendCode')}
        </Button>
      </CardFooter>
    </>
  )
}
