'use client'

import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/format'
import { cn, handleErrorApi } from '@/lib/utils'
import { useEnrollMutation } from '@/queries/useEnrollments'
import { useCreateOrderMutation } from '@/queries/useOrder'
import { Loader2, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { Link, useRouter } from '@/i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'

// Nút chính của trang chi tiết, theo isEnrolled backend trả về:
//   null  → khách chưa đăng nhập   → "Đăng nhập để ghi danh / mua" (link sang /login)
//   true  → đã ghi danh / đã mua   → "Vào học" (link sang /learn/:id)
//   false → đã đăng nhập, chưa có khóa:
//             miễn phí → nút "Ghi danh miễn phí" (gọi API ghi danh)
//             có phí   → nút "Mua khóa học" (tạo đơn hàng → sang trang thanh toán)
// Client Component vì có onClick + hook (useMutation, useRouter)
export default function EnrollButton({
  courseId,
  isEnrolled,
  price,
  className
}: {
  courseId: number
  isEnrolled: boolean | null
  price: number
  // Đổi kích thước theo chỗ đặt (vd nút nhỏ cạnh giá trên thẻ khóa học)
  className?: string
}) {
  const t = useTranslations('CourseDetail')
  const locale = useLocale()
  const enrollMutation = useEnrollMutation()
  const createOrderMutation = useCreateOrderMutation()
  const router = useRouter()
  const isPaid = price > 0

  if (isEnrolled === null) {
    return (
      <Button asChild size='lg' className={cn('h-11 w-full rounded-full text-base', className)}>
        <Link href='/login'>{isPaid ? t('loginToBuy') : t('loginToEnroll')}</Link>
      </Button>
    )
  }

  if (isEnrolled) {
    return (
      <Button asChild size='lg' className={cn('h-11 w-full rounded-full text-base', className)}>
        <Link href={`/learn/${courseId}`}>{t('goToCourse')}</Link>
      </Button>
    )
  }

  const enroll = async () => {
    // Đang gọi API rồi thì bỏ qua (chặn bấm 2 lần liên tiếp tạo 2 request)
    if (enrollMutation.isPending) return
    try {
      await enrollMutation.mutateAsync({ courseId })
      toast.success(t('enrollSuccess'))
      // router.refresh(): chạy lại Server Component của trang này (KHÔNG tải lại cả trang)
      // → getDetail trả isEnrolled: true → nút đổi thành "Vào học", số học viên +1
      router.refresh()
    } catch (error) {
      // Lỗi (409 đã ghi danh / là giảng viên của khóa, mất mạng...) → toast lỗi
      handleErrorApi({ error })
    }
  }

  // Khóa có phí: tạo đơn hàng (backend chốt giá; bấm nhiều lần thì dùng lại đơn đang chờ) → sang trang thanh toán
  const buy = async () => {
    if (createOrderMutation.isPending) return
    try {
      const result = await createOrderMutation.mutateAsync({ courseId })
      router.push(`/checkout/${result.payload.data.id}`)
    } catch (error) {
      // 409: khóa của chính mình / đã sở hữu khóa → toast lỗi
      handleErrorApi({ error })
    }
  }

  if (isPaid) {
    return (
      <Button
        size='lg'
        className={cn('h-11 w-full rounded-full text-base', className)}
        onClick={buy}
        disabled={createOrderMutation.isPending}
      >
        {createOrderMutation.isPending ? <Loader2 className='animate-spin' /> : <ShoppingCart />}
        {t('buy', { price: formatPrice(price, locale) })}
      </Button>
    )
  }

  return (
    <Button
      size='lg'
      className={cn('h-11 w-full rounded-full text-base', className)}
      onClick={enroll}
      disabled={enrollMutation.isPending}
    >
      {enrollMutation.isPending && <Loader2 className='animate-spin' />}
      {t('enrollFree')}
    </Button>
  )
}
