'use client'

import StarInput from '@/components/star-input'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { handleErrorApi } from '@/lib/utils'
import { useCreateReviewMutation, useUpdateReviewMutation } from '@/queries/useReview'
import { ReviewType, UpdateReviewBodySchema, UpdateReviewBodyType } from '@/schemaValidations/review.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'

// 1 form dùng cho CẢ viết mới lẫn sửa:
//   review = undefined → viết mới: form trống, gửi bằng create (body có thêm courseId)
//   review có giá trị   → sửa: điền sẵn dữ liệu cũ, gửi bằng update(review.id, ...)
export default function ReviewForm({
  courseId,
  review,
  onDone
}: {
  courseId: number
  review?: ReviewType
  onDone?: () => void // gọi sau khi gửi xong / bấm Hủy (để thoát chế độ sửa)
}) {
  const router = useRouter()
  const createMutation = useCreateReviewMutation()
  const updateMutation = useUpdateReviewMutation()
  const isEdit = Boolean(review)
  const isPending = createMutation.isPending || updateMutation.isPending

  // Validate bằng đúng schema copy từ backend (rating 1–5, comment ≤ 2000 ký tự).
  // Dùng UpdateReviewBodySchema (chỉ rating + comment) cho cả 2 chế độ: courseId không phải ô nhập,
  // lúc tạo mới mới ghép thêm vào body
  const form = useForm<UpdateReviewBodyType>({
    resolver: zodResolver(UpdateReviewBodySchema),
    defaultValues: {
      rating: review?.rating ?? 0, // 0 = chưa chọn → Zod báo "Số sao từ 1 đến 5"
      comment: review?.comment ?? ''
    }
  })

  const onSubmit = async (data: UpdateReviewBodyType) => {
    if (isPending) return
    try {
      if (review) {
        await updateMutation.mutateAsync({ reviewId: review.id, body: data })
        toast.success('Đã cập nhật đánh giá')
      } else {
        await createMutation.mutateAsync({ ...data, courseId })
        toast.success('Cảm ơn bạn đã đánh giá')
      }
      // Hook đã invalidateQueries(['reviews']) → "đánh giá của tôi" (client) tải lại.
      // Danh sách đánh giá + điểm trung bình render ở SERVER → refresh để server tính lại
      router.refresh()
      onDone?.()
    } catch (error) {
      // 422: lỗi từng ô (gắn vào đúng ô) · 409 đã đánh giá rồi, 403 chưa ghi danh...: toast
      handleErrorApi({ error, setError: form.setError })
    }
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-4'>
      <FieldGroup>
        <Controller
          name='rating'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Bạn đánh giá khóa học này bao nhiêu sao?</FieldLabel>
              <StarInput value={field.value} onChange={field.onChange} invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='comment'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='review-comment'>Nhận xét (không bắt buộc)</FieldLabel>
              <Textarea
                {...field}
                id='review-comment'
                rows={4}
                maxLength={2000}
                placeholder='Khóa học có dễ hiểu không? Bạn học được gì?'
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <div className='flex justify-end gap-2'>
        {isEdit && (
          <Button type='button' variant='ghost' onClick={onDone} disabled={isPending}>
            Hủy
          </Button>
        )}
        <Button type='submit' disabled={isPending}>
          {isPending && <Loader2 className='animate-spin' />}
          {isEdit ? 'Lưu thay đổi' : 'Gửi đánh giá'}
        </Button>
      </div>
    </form>
  )
}
