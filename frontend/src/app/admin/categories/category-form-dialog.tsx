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
import { Textarea } from '@/components/ui/textarea'
import { handleErrorApi } from '@/lib/utils'
import { useCreateCategoryMutation, useUpdateCategoryMutation } from '@/queries/useCategory'
import { CategoryType, CreateCategoryBodySchema, CreateCategoryBodyType } from '@/schemaValidations/category.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

// Hộp thoại thêm / sửa danh mục, dùng chung 1 form (giống CourseForm):
//   có category → SỬA danh mục đó (điền sẵn dữ liệu cũ)
//   không có    → THÊM mới (form trống)
export default function CategoryFormDialog({
  open,
  category,
  onClose
}: {
  open: boolean
  category?: CategoryType
  onClose: () => void
}) {
  const form = useForm<CreateCategoryBodyType>({
    resolver: zodResolver(CreateCategoryBodySchema),
    defaultValues: category ? { name: category.name, description: category.description } : { name: '', description: '' }
  })

  const createCategoryMutation = useCreateCategoryMutation()
  const updateCategoryMutation = useUpdateCategoryMutation()
  const isSaving = createCategoryMutation.isPending || updateCategoryMutation.isPending
  const onSubmit = async (data: CreateCategoryBodyType) => {
    if (isSaving) return
    try {
      const result = category
        ? await updateCategoryMutation.mutateAsync({
            id: category.id,
            body: data
          })
        : await createCategoryMutation.mutateAsync(data)
      toast.success(result.payload.message)
      onClose()
    } catch (error) {
      handleErrorApi({ error, setError: form.setError })
    }
  }

  const isEdit = Boolean(category)

  return (
    // onOpenChange: Dialog tự gọi khi người dùng bấm ra ngoài, bấm X hoặc phím Esc → đóng hộp thoại
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Sửa danh mục' : 'Thêm danh mục'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Đổi tên hoặc mô tả. Các khóa học trong danh mục giữ nguyên.' : 'Tên danh mục không được trùng.'}
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6'>
          <FieldGroup>
            <Controller
              name='name'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='category-name'>Tên danh mục</FieldLabel>
                  <Input
                    {...field}
                    id='category-name'
                    autoFocus
                    placeholder='Ví dụ: Lập trình di động'
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name='description'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='category-description'>Mô tả (không bắt buộc)</FieldLabel>
                  <Textarea
                    {...field}
                    // description không bắt buộc → có thể là undefined; ô nhập cần chuỗi
                    value={field.value ?? ''}
                    id='category-description'
                    rows={3}
                    placeholder='Danh mục này gồm những khóa học về...'
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose} disabled={isSaving}>
              Hủy
            </Button>
            <Button type='submit' disabled={isSaving}>
              {isSaving && <Loader2 className='animate-spin' />}
              {isEdit ? 'Lưu thay đổi' : 'Thêm danh mục'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
