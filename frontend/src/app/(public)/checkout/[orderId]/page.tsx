import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import Checkout, { CheckoutSkeleton } from './checkout'

export const metadata: Metadata = {
  title: 'Thanh toán'
}

// /checkout/12: trang thanh toán của đơn hàng 12.
// params là dữ liệu lúc chạy → đọc trong component con bọc <Suspense> (giống trang chi tiết khóa học)
export default function CheckoutPage({ params }: PageProps<'/checkout/[orderId]'>) {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutContent params={params} />
    </Suspense>
  )
}

async function CheckoutContent({ params }: { params: Promise<{ orderId: string }> }) {
  const orderId = Number((await params).orderId)
  // /checkout/abc → 404 luôn, không gọi API
  if (!Number.isInteger(orderId) || orderId <= 0) notFound()
  return <Checkout orderId={orderId} />
}
