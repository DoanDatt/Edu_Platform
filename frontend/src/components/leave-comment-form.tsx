'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import type { FieldErrors, UseFormRegisterReturn } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { useZodErrorTranslator } from '@/i18n/zod-errors'

// Khối form "Leave A Comment" / "Contact Us" của EduPress (dùng chung cho bình luận khóa học và trang Liên hệ):
// tiêu đề + dòng "Your email address will not be published", 2 ô Name / Email cùng hàng, ô Comment lớn,
// checkbox "Save my name, email in this browser...", nút cam "Posts Comment".
// Form (react-hook-form) do nơi dùng quản lý; component này chỉ lo giao diện + ghi nhớ tên / email

// Ghi nhớ tên + email trong trình duyệt (ô "Save my name, email..."). Chỉ là tiện ích cho người dùng,
// lỗi đọc / ghi (chế độ ẩn danh, chặn bộ nhớ) thì bỏ qua
const STORAGE_KEY = 'edu-comment-author'

export const readSavedAuthor = (): { name: string; email: string } | null => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    return saved && typeof saved.name === 'string' && typeof saved.email === 'string' ? saved : null
  } catch {
    return null
  }
}

export const saveAuthor = (author: { name: string; email: string } | null) => {
  try {
    if (author) localStorage.setItem(STORAGE_KEY, JSON.stringify(author))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // bỏ qua
  }
}

const fieldClass =
  'w-full rounded-md border border-input bg-card px-4 text-base outline-none placeholder:text-grey focus-visible:border-primary aria-invalid:border-destructive'

export default function LeaveCommentForm({
  title,
  showIdentity,
  register,
  errors,
  isSubmitting,
  remember,
  onRememberChange,
  onSubmit,
  className
}: {
  title: string
  // false khi đã đăng nhập: tên + email lấy từ tài khoản → ẩn 2 ô và checkbox ghi nhớ
  showIdentity: boolean
  register: {
    name: UseFormRegisterReturn
    email: UseFormRegisterReturn
    content: UseFormRegisterReturn
  }
  errors: FieldErrors<{ name?: string; email?: string; content?: string; message?: string }>
  isSubmitting: boolean
  remember: boolean
  onRememberChange: (value: boolean) => void
  onSubmit: React.FormEventHandler<HTMLFormElement>
  className?: string
}) {
  const t = useTranslations('Comments')
  const id = useId()
  // Câu lỗi trong schema viết tiếng Việt → dịch lúc hiển thị (giống các form khác)
  const translate = useZodErrorTranslator()
  const nameError = translate(errors.name)?.message
  const emailError = translate(errors.email)?.message
  const contentError = translate(errors.content ?? errors.message)?.message

  return (
    <form onSubmit={onSubmit} noValidate className={cn('flex flex-col gap-5', className)}>
      <div className='flex flex-col gap-2'>
        <h2 className='text-xl leading-[1.2] md:text-2xl'>{title}</h2>
        <p className='text-base text-muted-foreground'>{t('notPublished')}</p>
      </div>

      {showIdentity && (
        <div className='grid gap-5 sm:grid-cols-2'>
          <div className='flex flex-col gap-1.5'>
            <input
              {...register.name}
              placeholder={`${t('name')}*`}
              aria-label={t('name')}
              aria-invalid={Boolean(nameError)}
              autoComplete='name'
              className={cn(fieldClass, 'h-12')}
            />
            {nameError && <p className='text-sm text-destructive'>{nameError}</p>}
          </div>
          <div className='flex flex-col gap-1.5'>
            <input
              {...register.email}
              type='email'
              placeholder={`${t('email')}*`}
              aria-label={t('email')}
              aria-invalid={Boolean(emailError)}
              autoComplete='email'
              className={cn(fieldClass, 'h-12')}
            />
            {emailError && <p className='text-sm text-destructive'>{emailError}</p>}
          </div>
        </div>
      )}

      <div className='flex flex-col gap-1.5'>
        <textarea
          {...register.content}
          placeholder={t('comment')}
          aria-label={t('comment')}
          aria-invalid={Boolean(contentError)}
          rows={5}
          className={cn(fieldClass, 'min-h-32 resize-y py-3')}
        />
        {contentError && <p className='text-sm text-destructive'>{contentError}</p>}
      </div>

      {showIdentity && (
        <label htmlFor={`${id}-remember`} className='flex cursor-pointer items-center gap-2.5 text-base text-muted-foreground'>
          <Checkbox
            id={`${id}-remember`}
            checked={remember}
            onCheckedChange={(value) => onRememberChange(value === true)}
            className='size-[18px] rounded-[3px] border-grey'
          />
          {t('remember')}
        </label>
      )}

      <Button type='submit' size='pill' disabled={isSubmitting} className='self-start'>
        {isSubmitting && <Loader2 className='animate-spin' />}
        {t('submit')}
      </Button>
    </form>
  )
}

// Đọc tên / email đã lưu SAU khi mount (server không có localStorage) rồi điền vào form
export function useSavedAuthor(apply: (author: { name: string; email: string }) => void) {
  const [remember, setRemember] = useState(false)
  useEffect(() => {
    const saved = readSavedAuthor()
    if (saved) {
      apply(saved)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ từ localStorage một lần khi mount
      setRemember(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return [remember, setRemember] as const
}
