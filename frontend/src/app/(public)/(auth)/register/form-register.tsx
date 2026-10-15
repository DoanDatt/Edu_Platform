'use client'

import { useAppContext } from '@/components/app-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { HttpError } from '@/lib/http'
import { handleErrorApi } from '@/lib/utils'
import { useRegisterMutation } from '@/queries/useAuth'
import { RegisterBodySchema, RegisterBodyType } from '@/schemaValidations/auth.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

export default function RegisterForm() {
  const registerMutation = useRegisterMutation()
  const { setRole } = useAppContext()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<RegisterBodyType>({
    resolver: zodResolver(RegisterBodySchema),
    // Ô nào có Controller thì phải có giá trị ban đầu (''), không để undefined
    defaultValues: { name: '', email: '', phoneNumber: '', password: '', confirmPassword: '' }
  })

  const onSubmit = async (data: RegisterBodyType) => {
    if (registerMutation.isPending) return
    try {
      const result = await registerMutation.mutateAsync(data)
      // Backend Edu: đăng ký xong là đăng nhập luôn, trả account giống login
      setRole(result.payload.data.account.role)
      toast.success(result.payload.message)
      router.push('/')
    } catch (error) {
      // 409: email đã có người dùng → hiện ngay dưới ô email
      if (error instanceof HttpError && error.status === 409) {
        form.setError('email', { message: error.payload.message })
        return
      }
      // 422: lỗi từng ô (gắn vào đúng ô) · 429 đăng ký quá nhiều lần, lỗi khác: toast
      handleErrorApi({ error, setError: form.setError })
    }
  }

  return (
    // Hiện dần + trượt từ dưới lên khi mở trang
    <Card className='w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300 motion-reduce:animate-none'>
      <CardHeader className='text-center'>
        <CardTitle className='text-2xl'>Đăng ký</CardTitle>
        <CardDescription>Tạo tài khoản để bắt đầu học trên EduPlatform</CardDescription>
      </CardHeader>

      <CardContent>
        {/* noValidate: tắt kiểm tra mặc định của trình duyệt, để Zod hiện lỗi tiếng Việt đồng nhất */}
        <form id='form-register' noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            {/* htmlFor của nhãn phải TRÙNG CHÍNH XÁC id của ô (phân biệt hoa thường) */}
            <Controller
              name='name'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='register-name'>Họ tên</FieldLabel>
                  <Input
                    {...field}
                    id='register-name'
                    placeholder='Nguyễn Văn A'
                    autoComplete='name'
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name='email'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='register-email'>Email</FieldLabel>
                  <Input
                    {...field}
                    id='register-email'
                    type='email'
                    placeholder='ban@email.com'
                    autoComplete='email'
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name='phoneNumber'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='register-phone'>Số điện thoại</FieldLabel>
                  {/* type='tel' chứ không phải 'number': số điện thoại là chuỗi (giữ số 0 đầu),
                      không có mũi tên tăng/giảm. inputMode: điện thoại hiện bàn phím số */}
                  <Input
                    {...field}
                    id='register-phone'
                    type='tel'
                    inputMode='numeric'
                    placeholder='0901234567'
                    autoComplete='tel'
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name='password'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='register-password'>Mật khẩu</FieldLabel>
                  <div className='relative'>
                    {/* new-password: trình duyệt gợi ý mật khẩu mạnh và lưu đúng mật khẩu mới */}
                    <Input
                      {...field}
                      id='register-password'
                      type={showPassword ? 'text' : 'password'}
                      placeholder='Tối thiểu 8 ký tự'
                      autoComplete='new-password'
                      aria-invalid={fieldState.invalid}
                      className='pr-9'
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword((prev) => !prev)}
                      className='absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground'
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
                    </button>
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name='confirmPassword'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='register-confirm-password'>Nhập lại mật khẩu</FieldLabel>
                  {/* Dùng chung showPassword với ô trên: bấm 👁 là hiện cả 2 ô */}
                  <Input
                    {...field}
                    id='register-confirm-password'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Nhập lại mật khẩu'
                    autoComplete='new-password'
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter className='flex flex-col gap-4'>
        {/* form='form-register': nút nằm ngoài thẻ <form> vẫn submit được form đó */}
        <Button type='submit' form='form-register' className='w-full' disabled={registerMutation.isPending}>
          {registerMutation.isPending && <Loader2 className='animate-spin' />}
          Đăng ký
        </Button>
        <p className='text-sm text-muted-foreground'>
          Đã có tài khoản?{' '}
          <Link href='/login' className='font-medium text-foreground underline-offset-4 hover:underline'>
            Đăng nhập
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
