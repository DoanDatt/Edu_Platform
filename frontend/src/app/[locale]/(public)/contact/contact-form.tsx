'use client'

import LeaveCommentForm, { saveAuthor, useSavedAuthor } from '@/components/leave-comment-form'
import { handleErrorApi } from '@/lib/utils'
import { useSendContactMutation } from '@/queries/useComment'
import { ContactBody, ContactBodyType } from '@/schemaValidations/contact.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

// Form "Contact Us" theo Figma EduPress (trang Contact): cùng giao diện với form bình luận khóa học.
// Gửi → backend lưu tin nhắn + email báo admin. Ô "Save my name..." ghi nhớ tên / email trong trình duyệt
export default function ContactForm() {
  const t = useTranslations('Contact')
  const sendMutation = useSendContactMutation()
  const form = useForm<ContactBodyType>({
    resolver: zodResolver(ContactBody),
    defaultValues: { name: '', email: '', message: '' }
  })
  const [remember, setRemember] = useSavedAuthor((author) => {
    form.setValue('name', author.name)
    form.setValue('email', author.email)
  })

  const onSubmit = form.handleSubmit(async (values) => {
    if (sendMutation.isPending) return
    try {
      await sendMutation.mutateAsync(values)
      saveAuthor(remember ? { name: values.name, email: values.email } : null)
      form.resetField('message')
      toast.success(t('sent'))
    } catch (error) {
      handleErrorApi({ error, setError: form.setError })
    }
  })

  return (
    <LeaveCommentForm
      title={t('formTitle')}
      showIdentity
      // Ô lớn của form dùng chung tên "content"; ở đây là trường "message" của API liên hệ
      register={{ name: form.register('name'), email: form.register('email'), content: form.register('message') }}
      errors={form.formState.errors}
      isSubmitting={sendMutation.isPending}
      remember={remember}
      onRememberChange={setRemember}
      onSubmit={onSubmit}
    />
  )
}
