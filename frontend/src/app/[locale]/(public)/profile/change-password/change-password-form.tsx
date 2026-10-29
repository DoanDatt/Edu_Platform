'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { handleErrorApi } from '@/lib/utils'
import { useChangePasswordMutation } from '@/queries/useProfile'
import { ChangePasswordBodySchema, ChangePasswordBodyType } from '@/schemaValidations/profile.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

// 3 ô cùng kiểu → khai báo 1 lần, render bằng map thay vì viết 3 khối Controller gần giống nhau
const FIELDS: { name: keyof ChangePasswordBodyType; label: string; autoComplete: string }[] = [
  // autoComplete: trình quản lý mật khẩu của trình duyệt biết ô nào là mật khẩu cũ / mới để gợi ý đúng
  { name: 'currentPassword', label: 'Mật khẩu hiện tại', autoComplete: 'current-password' },
  { name: 'newPassword', label: 'Mật khẩu mới', autoComplete: 'new-password' },
  { name: 'confirmPassword', label: 'Nhập lại mật khẩu mới', autoComplete: 'new-password' }
]

export default function ChangePasswordForm() {
  const changePasswordMutation = useChangePasswordMutation()

  // ChangePasswordBodySchema có 2 .refine (nhập lại khớp / mật khẩu mới khác mật khẩu cũ)
  // → lỗi hiện đúng ô (path) NGAY khi bấm, chưa cần gọi API
  const form = useForm<ChangePasswordBodyType>({
    resolver: zodResolver(ChangePasswordBodySchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' }
  })

  const onSubmit = async (data: ChangePasswordBodyType) => {
    if (changePasswordMutation.isPending) return
    try {
      // Trình duyệt → Route Handler /api/profile/password → backend.
      // Route Handler ghi đè 2 cookie, http.ts ghi đè localStorage bằng cặp token mới
      // → vẫn đăng nhập tiếp ở thiết bị này, các thiết bị khác bị đăng xuất
      const result = await changePasswordMutation.mutateAsync(data)
      toast.success(result.payload.message)
      form.reset() // xóa trắng 3 ô: không để mật khẩu nằm lại trên màn hình
    } catch (error) {
      // 422 "Mật khẩu hiện tại không đúng" → gắn vào ô currentPassword · lỗi khác: toast
      handleErrorApi({ error, setError: form.setError })
    }
  }

  return (
    <Card>
      <CardContent>
        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6'>
          <FieldGroup>
            {FIELDS.map((item) => (
              <Controller
                key={item.name}
                name={item.name}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`password-${item.name}`}>{item.label}</FieldLabel>
                    <Input
                      {...field}
                      id={`password-${item.name}`}
                      type='password'
                      autoComplete={item.autoComplete}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            ))}
          </FieldGroup>

          <Button type='submit' disabled={changePasswordMutation.isPending}>
            {changePasswordMutation.isPending && <Loader2 className='animate-spin' />}
            Đổi mật khẩu
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
