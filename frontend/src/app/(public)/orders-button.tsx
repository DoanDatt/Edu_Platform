'use client'

import { useAppContext } from '@/components/app-provider'
import { Button } from '@/components/ui/button'
import { OrderStatus } from '@/constants/type'
import { useMyOrderQuery } from '@/queries/useOrder'
import { ShoppingCart } from 'lucide-react'
import Link from 'next/link'

// Biểu tượng giỏ hàng trên header. Web mua TỪNG khóa (không có giỏ nhiều món) → giỏ = các đơn ĐANG CHỜ thanh toán:
// huy hiệu là số đơn chờ (thật, từ API), bấm vào mở lịch sử mua hàng lọc sẵn đơn chờ để thanh toán tiếp.
// Chưa đăng nhập: không hiện (API đơn hàng cần đăng nhập)
export default function OrdersButton() {
  const { isAuth } = useAppContext()
  if (!isAuth) return null
  return <PendingOrdersButton />
}

// Tách component: hook chỉ chạy khi đã đăng nhập (hook không được gọi trong if)
function PendingOrdersButton() {
  // limit 1: chỉ cần totalItems (số đơn chờ), không cần danh sách
  const { data } = useMyOrderQuery({ status: OrderStatus.PENDING, page: 1, limit: 1 })
  const pendingCount = data?.payload.totalItems ?? 0

  return (
    <Button asChild variant='ghost' size='icon' className='relative rounded-full'>
      <Link
        href='/my-orders?status=PENDING'
        aria-label={pendingCount > 0 ? `${pendingCount} đơn chờ thanh toán` : 'Đơn hàng'}
        title='Đơn chờ thanh toán'
      >
        <ShoppingCart className='size-5' />
        {pendingCount > 0 && (
          <span className='absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full bg-highlight text-[10px] font-bold text-highlight-foreground'>
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
      </Link>
    </Button>
  )
}
