'use client'

import { Button } from '@/components/ui/button'
import { OrderStatus } from '@/constants/type'
import { generateSlugUrl } from '@/lib/format'
import { useConfirmPaymentMutation } from '@/queries/useOrder'
import { Clock, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { StatusCard } from '../checkout'

// Vừa vào trang → gọi POST /orders/:id/confirm MỘT lần: backend hỏi thẳng MoMo / thu tiền PayPal rồi trả đơn đã cập nhật.
// (Bình thường MoMo đã báo IPN cho backend trước rồi; chạy máy local thì MoMo không gọi vào được → confirm hỏi bù)
export default function CheckoutResult({ orderId }: { orderId: number }) {
  const searchParams = useSearchParams()
  const confirmMutation = useConfirmPaymentMutation()
  const { mutate: confirm } = confirmMutation
  // useRef: đánh dấu đã gọi confirm chưa. Chế độ dev (StrictMode) chạy useEffect 2 lần liên tiếp,
  // không chặn thì gọi confirm 2 lần (PayPal sẽ bị capture 2 lần → lần 2 báo lỗi)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    // mutate (không phải mutateAsync): không cần await, kết quả đọc qua confirmMutation.data / isError bên dưới
    confirm(orderId)
  }, [orderId, confirm])

  const order = confirmMutation.data?.payload.data

  // Chưa gọi xong (idle: chưa kịp chạy, pending: đang chờ backend hỏi cổng thanh toán)
  if (confirmMutation.isIdle || confirmMutation.isPending) {
    return (
      <StatusCard
        Icon={Loader2}
        iconClassName='animate-spin'
        tone='pending'
        title='Đang xác nhận thanh toán...'
        description='Vui lòng không đóng trang, việc này chỉ mất vài giây.'
      />
    )
  }

  if (confirmMutation.isError || !order) {
    return (
      <StatusCard
        Icon={XCircle}
        tone='error'
        title='Không xác nhận được thanh toán'
        description='Có lỗi khi kiểm tra với cổng thanh toán. Nếu bạn đã bị trừ tiền, đừng lo: đơn sẽ được cập nhật sau ít phút.'
      >
        <Button variant='outline' className='mt-3 rounded-full' onClick={() => confirmMutation.mutate(orderId)}>
          Thử kiểm tra lại
        </Button>
      </StatusCard>
    )
  }

  if (order.status === OrderStatus.PAID) {
    return (
      <StatusCard
        Icon={CheckCircle2}
        tone='success'
        title='Thanh toán thành công'
        description={`Bạn đã sở hữu khóa "${order.course.title}". Chúc bạn học tốt!`}
        action={{ href: `/learn/${order.course.id}`, label: 'Vào học ngay' }}
      >
        <Link href='/my-orders' className='text-sm text-muted-foreground hover:text-foreground'>
          Xem lịch sử mua hàng
        </Link>
      </StatusCard>
    )
  }

  if (order.status === OrderStatus.CANCELLED) {
    return (
      <StatusCard
        Icon={XCircle}
        tone='muted'
        title='Đơn hàng đã bị hủy'
        description='Đơn đã hủy hoặc quá hạn thanh toán.'
        action={{
          href: `/courses/${generateSlugUrl({ name: order.course.title, id: order.course.id })}`,
          label: 'Mua lại khóa học'
        }}
      />
    )
  }

  // Vẫn PENDING: người mua bấm hủy trên trang của cổng, thẻ lỗi... (MoMo báo resultCode khác 0)
  const momoFailed = searchParams.has('resultCode') && searchParams.get('resultCode') !== '0'
  return (
    <StatusCard
      Icon={Clock}
      tone='pending'
      title={momoFailed ? 'Thanh toán chưa thành công' : 'Chưa nhận được thanh toán'}
      description={
        momoFailed
          ? 'Giao dịch đã bị hủy hoặc không thành công. Bạn có thể thử lại hoặc chọn cách thanh toán khác.'
          : 'Nếu bạn vừa thanh toán xong, hãy đợi vài giây rồi bấm kiểm tra lại.'
      }
      action={{ href: `/checkout/${orderId}`, label: 'Thanh toán lại' }}
    >
      <Button variant='ghost' className='rounded-full' onClick={() => confirmMutation.mutate(orderId)}>
        Kiểm tra lại
      </Button>
    </StatusCard>
  )
}
