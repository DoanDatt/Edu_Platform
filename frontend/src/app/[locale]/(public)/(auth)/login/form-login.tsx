'use client'

import { useAppContext } from '@/components/app-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { HttpError } from '@/lib/http'
import { handleErrorApi } from '@/lib/utils'
import { useLoginMutation } from '@/queries/useAuth'
import { LoginBodySchema, LoginBodyType } from '@/schemaValidations/auth.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Link, useRouter } from '@/i18n/navigation'
import { useZodErrorTranslator } from '@/i18n/zod-errors'
import { useTranslations } from 'next-intl'

export default function LoginForm() {
  const t = useTranslations('Auth')
  const translateError = useZodErrorTranslator()
  const loginMutation = useLoginMutation()
  const { setRole } = useAppContext()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginBodyType>({
    resolver: zodResolver(LoginBodySchema),
    defaultValues: { email: '', password: '' }
  })

  const onSubmit = async (data: LoginBodyType) => {
    console.log('data', data)
    if (loginMutation.isPending) return
    try {
      const result = await loginMutation.mutateAsync(data)
      // Báo cho AppProvider → menu đổi ngay (backend trả sẵn role trong account)
      setRole(result.payload.data.account.role)
      console.log('result', result)
      toast.success(result.payload.message)
      router.push('/')
    } catch (error) {
      // 401: sai email hoặc mật khẩu → hiện ngay trên form, không chỉ toast
      if (error instanceof HttpError && error.status === 401) {
        form.setError('root', { message: error.payload.message })
        return
      }
      // 422: lỗi từng ô (gắn vào đúng ô) · 403 tài khoản bị khóa, lỗi khác: toast
      handleErrorApi({ error, setError: form.setError })
    }
  }

  return (
    // Hiện dần + trượt từ dưới lên khi mở trang
    <Card className='w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300 motion-reduce:animate-none'>
      <CardHeader className='text-center'>
        <CardTitle className='text-2xl'>{t('login')}</CardTitle>
        <CardDescription>{t('loginDescription')}</CardDescription>
      </CardHeader>

      <CardContent>
        {/* noValidate: tắt kiểm tra mặc định của trình duyệt (type='email'),
            để Zod hiện lỗi tiếng Việt đồng nhất */}
        <form id='form-login' noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            {/* Controller: nối 1 ô input với react-hook-form
                  field: value, onChange, onBlur, name, ref → trải thẳng vào <Input />
                  fieldState: invalid, error → hiện lỗi */}
            <Controller
              name='email'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='login-email'>Email</FieldLabel>
                  <Input
                    {...field}
                    id='login-email'
                    type='email'
                    placeholder={t('emailPlaceholder')}
                    autoComplete='email'
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[translateError(fieldState.error)]} />}
                </Field>
              )}
            />

            <Controller
              name='password'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className='flex items-center justify-between'>
                    <FieldLabel htmlFor='login-password'>{t('password')}</FieldLabel>
                    <Link
                      href='/forgot-password'
                      className='text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline'
                    >
                      {t('forgotPassword')}
                    </Link>
                  </div>
                  <div className='relative'>
                    <Input
                      {...field}
                      id='login-password'
                      type={showPassword ? 'text' : 'password'}
                      placeholder='••••••••'
                      autoComplete='current-password'
                      aria-invalid={fieldState.invalid}
                      className='pr-9'
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword((prev) => !prev)}
                      className='absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground'
                      aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                    >
                      {showPassword ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
                    </button>
                  </div>
                  {fieldState.invalid && <FieldError errors={[translateError(fieldState.error)]} />}
                </Field>
              )}
            />

            {/* Lỗi chung của cả form (sai email hoặc mật khẩu) */}
            {form.formState.errors.root && (
              <p
                role='alert'
                className='rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200 motion-reduce:animate-none'
              >
                {form.formState.errors.root.message}
              </p>
            )}
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter className='flex flex-col gap-4'>
        {/* form='form-login': nút nằm ngoài thẻ <form> vẫn submit được form đó */}
        <Button type='submit' form='form-login' className='w-full' disabled={loginMutation.isPending}>
          {loginMutation.isPending && <Loader2 className='animate-spin' />}
          {t('login')}
        </Button>
        <p className='text-sm text-muted-foreground'>
          {t('noAccount')}{' '}
          <Link href='/register' className='font-medium text-foreground underline-offset-4 hover:underline'>
            {t('register')}
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
