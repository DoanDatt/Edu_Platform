import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { CheckoutSkeleton } from '../checkout'
import CheckoutResult from './checkout-result'

export const metadata: Metadata = {
  title: 'Kết quả thanh toán'
}

// MoMo / PayPal trả người mua về đây sau khi thanh toán (hoặc bấm hủy) trên trang của cổng.
// MoMo gắn thêm ?resultCode=0 (0 = thành công), PayPal gắn ?token=...
export default function CheckoutResultPage({ params }: PageProps<'/[locale]/checkout/[orderId]/result'>) {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <ResultContent params={params} />
    </Suspense>
  )
}

async function ResultContent({ params }: { params: Promise<{ orderId: string }> }) {
  const orderId = Number((await params).orderId)
  if (!Number.isInteger(orderId) || orderId <= 0) notFound()
  return <CheckoutResult orderId={orderId} />
}
