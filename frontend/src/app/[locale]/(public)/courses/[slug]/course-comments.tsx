'use client'

import { useAppContext } from '@/components/app-provider'
import LeaveCommentForm, { saveAuthor, useSavedAuthor } from '@/components/leave-comment-form'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import { cn, handleErrorApi } from '@/lib/utils'
import { useCommentsQuery, useCreateCommentMutation } from '@/queries/useComment'
import { CreateCommentBody, CreateCommentBodyType } from '@/schemaValidations/comment.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useLocale, useTranslations } from 'next-intl'
import z from 'zod'

// Khách bắt buộc nhập tên + email; đã đăng nhập thì backend lấy từ tài khoản → 2 ô bị ẩn, không kiểm tra
const GuestCommentBody = CreateCommentBody.extend({
  name: z.string().trim().min(1, 'Vui lòng nhập tên').max(100),
  email: z.email('Email không hợp lệ').max(200)
})

// Bình luận dưới 5 tab của trang chi tiết (Figma EduPress: "Leave A Comment").
// Trên: danh sách bình luận (mới nhất trước, 5 / trang) hoặc "Chưa có bình luận"; dưới: form gửi.
// Khác đánh giá (tab Reviews): ai cũng bình luận được, không cần ghi danh, không chấm sao
export default function CourseComments({ courseId }: { courseId: number }) {
  const t = useTranslations('Comments')
  const locale = useLocale()
  const { isAuth } = useAppContext()
  const [page, setPage] = useState(1)
  const commentsQuery = useCommentsQuery(courseId, page)
  const createMutation = useCreateCommentMutation(courseId)

  const form = useForm<CreateCommentBodyType>({
    resolver: zodResolver(isAuth ? CreateCommentBody : GuestCommentBody),
    defaultValues: { name: '', email: '', content: '' }
  })
  const [remember, setRemember] = useSavedAuthor((author) => {
    form.setValue('name', author.name)
    form.setValue('email', author.email)
  })

  const onSubmit = form.handleSubmit(async (values) => {
    if (createMutation.isPending) return
    try {
      // Đã đăng nhập: chỉ gửi nội dung (gửi kèm tên / email cũng bị backend bỏ qua)
      await createMutation.mutateAsync(isAuth ? { content: values.content } : values)
      if (!isAuth) saveAuthor(remember && values.name && values.email ? { name: values.name, email: values.email } : null)
      form.resetField('content')
      setPage(1) // bình luận mới nằm đầu trang 1
      toast.success(t('sent'))
    } catch (error) {
      handleErrorApi({ error, setError: form.setError })
    }
  })

  const data = commentsQuery.data?.payload
  const comments = data?.data ?? []

  return (
    <section className='flex flex-col gap-10'>
      <div className='flex flex-col gap-6'>
        <h2 className='text-xl leading-[1.2] md:text-2xl'>{t('title', { count: data?.totalItems ?? 0 })}</h2>
        {commentsQuery.isLoading ? (
          <Skeleton className='h-24 rounded-[20px]' />
        ) : comments.length === 0 ? (
          <p className='text-muted-foreground'>{t('empty')}</p>
        ) : (
          <ul className={cn('flex flex-col divide-y', commentsQuery.isFetching && 'opacity-60')}>
            {comments.map((comment) => (
              <li key={comment.id} className='flex gap-4 py-5 first:pt-0'>
                <Avatar className='size-12 shrink-0'>
                  <AvatarImage src={comment.user?.avatar ?? undefined} alt={comment.name} />
                  <AvatarFallback>{comment.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
                  <div className='flex flex-wrap items-baseline justify-between gap-2'>
                    <span className='font-heading text-lg font-semibold'>{comment.name}</span>
                    <time dateTime={comment.createdAt} className='text-sm text-muted-foreground'>
                      {formatDate(comment.createdAt, locale)}
                    </time>
                  </div>
                  <p className='leading-relaxed break-words whitespace-pre-line text-muted-foreground'>
                    {comment.content}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {data && data.totalPages > 1 && (
          <nav aria-label={t('pagination')} className='flex items-center justify-center gap-2.5'>
            <button
              type='button'
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              aria-label={t('previous')}
              className='flex size-10 items-center justify-center rounded-full border disabled:opacity-50'
            >
              <ChevronLeft className='size-4' />
            </button>
            {Array.from({ length: data.totalPages }, (_, index) => index + 1).map((n) => (
              <button
                key={n}
                type='button'
                onClick={() => setPage(n)}
                aria-current={n === page ? 'page' : undefined}
                className={cn(
                  'size-10 rounded-full text-base',
                  n === page ? 'bg-foreground text-background' : 'hover:bg-secondary'
                )}
              >
                {n}
              </button>
            ))}
            <button
              type='button'
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= data.totalPages}
              aria-label={t('next')}
              className='flex size-10 items-center justify-center rounded-full border disabled:opacity-50'
            >
              <ChevronRight className='size-4' />
            </button>
          </nav>
        )}
      </div>

      <LeaveCommentForm
        title={t('leaveTitle')}
        showIdentity={!isAuth}
        register={{ name: form.register('name'), email: form.register('email'), content: form.register('content') }}
        errors={form.formState.errors}
        isSubmitting={createMutation.isPending}
        remember={remember}
        onRememberChange={setRemember}
        onSubmit={onSubmit}
      />
    </section>
  )
}
