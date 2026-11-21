'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { handleErrorApi } from '@/lib/utils'
import { useCreateRoleMutation } from '@/queries/useRole'
import { RoleFormSchema, RoleFormType } from '@/schemaValidations/role.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

// Tạo vai trò mới (chưa có quyền nào). Tạo xong chọn luôn vai trò đó để tick quyền
export default function RoleFormDialog({
  open,
  onClose,
  onCreated
}: {
  open: boolean
  onClose: () => void
  onCreated: (id: number) => void
}) {
  const createMutation = useCreateRoleMutation()
  const form = useForm<RoleFormType>({
    resolver: zodResolver(RoleFormSchema),
    defaultValues: { name: '', description: '' }
  })

  const onSubmit = async (data: RoleFormType) => {
    if (createMutation.isPending) return
    try {
      const result = await createMutation.mutateAsync({ name: data.name, description: data.description || undefined })
      toast.success(`Đã tạo vai trò ${result.payload.data.name}. Tick quyền cho vai trò rồi bấm Lưu.`)
      form.reset()
      onCreated(result.payload.data.id)
    } catch (error) {
      handleErrorApi({ error, setError: form.setError })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          form.reset()
          onClose()
        }
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Tạo vai trò</DialogTitle>
          <DialogDescription>Ví dụ: MODERATOR (kiểm duyệt đánh giá). Tên tự chuyển sang chữ IN HOA.</DialogDescription>
        </DialogHeader>
        <form id='role-form' noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name='name'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='new-role-name'>Tên vai trò</FieldLabel>
                  <Input {...field} id='new-role-name' className='uppercase' aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name='description'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='new-role-description'>Mô tả</FieldLabel>
                  <Input {...field} id='new-role-description' aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Hủy
          </Button>
          <Button type='submit' form='role-form' disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className='animate-spin' />}
            Tạo vai trò
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
