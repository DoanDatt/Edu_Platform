'use client'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { handleErrorApi } from '@/lib/utils'
import { RejectCourseBody, RejectCourseBodyType } from '@/schemaValidations/course.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'

// Form 1 ô "lý do", dùng cho Từ chối và Gỡ khóa (cùng body { reason }).
// onSubmit do nơi dùng truyền vào (gọi API nào là việc của nơi đó), form chỉ lo nhập + kiểm tra + lỗi
export default function ReasonForm({
  label,
  placeholder,
  submitLabel,
  onSubmit,
  onCancel
}: {
  label: string
  placeholder?: string
  submitLabel: string
  onSubmit: (reason: string) => Promise<void>
  onCancel: () => void
}) {
  const form = useForm<RejectCourseBodyType>({
    resolver: zodResolver(RejectCourseBody),
    defaultValues: { reason: '' }
  })

  const handleSubmit = async ({ reason }: RejectCourseBodyType) => {
    try {
      await onSubmit(reason)
    } catch (error) {
      handleErrorApi({ error, setError: form.setError })
    }
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(handleSubmit)} className='flex flex-col gap-3'>
      <Controller
        name='reason'
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor='review-reason'>{label}</FieldLabel>
            <Textarea
              {...field}
              id='review-reason'
              rows={4}
              autoFocus
              placeholder={placeholder}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <div className='flex justify-end gap-2'>
        <Button type='button' variant='ghost' onClick={onCancel} disabled={form.formState.isSubmitting}>
          Hủy
        </Button>
        <Button type='submit' variant='destructive' disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className='animate-spin' />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
