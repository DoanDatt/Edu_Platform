import PageBanner from '@/components/page-banner'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import MyOrders, { MyOrdersSkeleton } from './my-orders'

export const metadata: Metadata = {
  title: 'Lịch sử mua hàng'
}

// Đơn hàng của chính mình. Danh sách là Client Component (useQuery, token ở localStorage).
// Bộ lọc + trang nằm trên URL (?status=PAID&page=2) → MyOrders dùng useSearchParams → phải bọc Suspense
export default function MyOrdersPage() {
  return (
    <div className='flex flex-col gap-6'>
      <PageBanner
        eyebrow='Tài khoản'
        title='Lịch sử mua hàng'
        description='Các khóa học bạn đã mua và đơn đang chờ thanh toán.'
      />
      <Suspense fallback={<MyOrdersSkeleton />}>
        <MyOrders />
      </Suspense>
    </div>
  )
}
