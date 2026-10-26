'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { RoleLabels } from '@/constants/type'
import { handleErrorApi } from '@/lib/utils'
import { useProfileQuery, useUpdateProfileMutation } from '@/queries/useProfile'
import { ProfileType, UpdateProfileBodySchema, UpdateProfileBodyType } from '@/schemaValidations/profile.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import AvatarForm from './avatar-form'

// Chia 2 tầng:
//   ProfileForm (ngoài): tải hồ sơ, lo đang tải / lỗi
//   ProfileInfoForm (trong): CHỈ hiện khi đã có dữ liệu → điền thẳng vào defaultValues
// Nếu gộp làm 1, useForm tạo ra lúc dữ liệu CHƯA về → ô trống → phải dùng useEffect + form.reset(data)
// để điền lại sau. Tách tầng thì khỏi cần, đơn giản và ít lỗi hơn
export default function ProfileForm() {
  const profileQuery = useProfileQuery()

  if (profileQuery.isLoading) return <Skeleton className='h-80 w-full rounded-xl' />
  if (profileQuery.isError || !profileQuery.data) {
    return (
      <p className='rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive'>
        Không tải được hồ sơ. Vui lòng thử lại sau.
      </p>
    )
  }

  const profile = profileQuery.data.payload.data
  return (
    <div className='flex flex-col gap-6'>
      <AvatarForm profile={profile} />
      <ProfileInfoForm profile={profile} />
    </div>
  )
}

function ProfileInfoForm({ profile }: { profile: ProfileType }) {
  const updateMutation = useUpdateProfileMutation()

  // Validate bằng đúng schema copy từ backend. avatar không có ô nhập ở đây
  // → không gửi → backend giữ nguyên avatar cũ (avatar làm ở bước Cloudinary)
  const form = useForm<UpdateProfileBodyType>({
    resolver: zodResolver(UpdateProfileBodySchema),
    defaultValues: {
      name: profile.name,
      phoneNumber: profile.phoneNumber
    }
  })

  const onSubmit = async (data: UpdateProfileBodyType) => {
    if (updateMutation.isPending) return
    try {
      const result = await updateMutation.mutateAsync(data)
      toast.success(result.payload.message)
      // Hook đã invalidate ['profile'] và ['me'] → tên trên header đổi theo.
      // reset với dữ liệu mới: form coi đây là giá trị "gốc" mới (nút Lưu mờ lại vì không còn gì thay đổi)
      form.reset({ name: result.payload.data.name, phoneNumber: result.payload.data.phoneNumber })
    } catch (error) {
      // 422: lỗi từng ô (gắn đúng ô) · lỗi khác: toast
      handleErrorApi({ error, setError: form.setError })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin cá nhân</CardTitle>
        <CardDescription>Email và vai trò không thể tự thay đổi.</CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6'>
          <FieldGroup>
            {/* Chỉ hiển thị, không phải ô nhập của form */}
            <div className='grid gap-4 sm:grid-cols-2'>
              <Field>
                <FieldLabel htmlFor='profile-email'>Email</FieldLabel>
                <Input id='profile-email' value={profile.email} disabled readOnly />
              </Field>
              <Field>
                <FieldLabel htmlFor='profile-role'>Vai trò</FieldLabel>
                <Input id='profile-role' value={RoleLabels[profile.role.name]} disabled readOnly />
              </Field>
            </div>

            <Controller
              name='name'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='profile-name'>Họ tên</FieldLabel>
                  <Input {...field} id='profile-name' autoComplete='name' aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name='phoneNumber'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='profile-phone'>Số điện thoại</FieldLabel>
                  {/* type='tel' (không phải 'number'): số điện thoại là CHUỖI, có thể bắt đầu bằng 0 */}
                  <Input
                    {...field}
                    id='profile-phone'
                    type='tel'
                    autoComplete='tel'
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          <div className='flex justify-end'>
            {/* isDirty: form có gì thay đổi so với giá trị gốc không → chưa sửa gì thì không cho bấm Lưu */}
            <Button type='submit' disabled={updateMutation.isPending || !form.formState.isDirty}>
              {updateMutation.isPending && <Loader2 className='animate-spin' />}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
