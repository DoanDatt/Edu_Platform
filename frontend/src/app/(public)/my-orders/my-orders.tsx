'use client'

import CourseCover from '@/components/course-cover'
import PaginationLinks from '@/components/pagination-links'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { OrderStatus, OrderStatusLabels, PaymentMethodLabels } from '@/constants/type'
import { formatDate, formatPrice, generateSlugUrl } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useMyOrderQuery } from '@/queries/useOrder'
import { OrderType } from '@/schemaValidations/order.schema'
import { ReceiptText } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type Status = OrderType['status']
const LIMIT = 10

// Màu nhãn trạng thái: chờ = vàng, đã trả = xanh lá, đã hủy = xám
const statusStyles: Record<Status, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  CANCELLED: 'bg-muted text-muted-foreground'
}

const filters: { value: Status | undefined; label: string }[] = [
  { value: undefined, label: 'Tất cả' },
  { value: OrderStatus.PAID, label: OrderStatusLabels.PAID },
  { value: OrderStatus.PENDING, label: OrderStatusLabels.PENDING },
  { value: OrderStatus.CANCELLED, label: OrderStatusLabels.CANCELLED }
]

export default function MyOrders() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Đọc bộ lọc trên URL. Giá trị lạ (?status=abc) → coi như không lọc
  const statusParam = searchParams.get('status')
  const status = Object.values(OrderStatus).find((s) => s === statusParam)
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const ordersQuery = useMyOrderQuery({ status, page, limit: LIMIT })

  // Đổi bộ lọc: bỏ page (về trang 1), giữ các tham số khác
  const setStatus = (value: Status | undefined) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set('status', value)
    else params.delete('status')
    params.delete('page')
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  const result = ordersQuery.data?.payload

  return (
    <div className='flex flex-col gap-5'>
      <div role='group' aria-label='Lọc theo trạng thái' className='flex flex-wrap gap-2'>
        {filters.map(({ value, label }) => (
          <button
            key={label}
            type='button'
            aria-pressed={status === value}
            onClick={() => setStatus(value)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              status === value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {ordersQuery.isLoading ? (
        <MyOrdersSkeleton />
      ) : ordersQuery.isError || !result ? (
        <p className='rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive'>
          Không tải được lịch sử mua hàng. Vui lòng thử lại sau.
        </p>
      ) : result.data.length === 0 ? (
        <div className='flex flex-col items-center gap-2 rounded-3xl border border-dashed bg-card px-4 py-16 text-center'>
          <span className='flex size-16 items-center justify-center rounded-2xl bg-primary/10'>
            <ReceiptText className='size-8 text-primary' />
          </span>
          <p className='mt-3 font-heading text-lg font-semibold'>
            {status ? 'Không có đơn hàng nào ở mục này' : 'Bạn chưa mua khóa học nào'}
          </p>
          <Button asChild className='mt-2 rounded-full'>
            <Link href='/courses?price=paid'>Khám phá khóa học</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* keepPreviousData: đổi trang thì danh sách cũ mờ đi trong lúc tải, không bị nháy trắng */}
          <ul className={cn('flex flex-col gap-3 transition-opacity', ordersQuery.isPlaceholderData && 'opacity-60')}>
            {result.data.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </ul>
          <PaginationLinks
            pathname={pathname}
            page={result.page}
            totalPages={result.totalPages}
            searchParams={Object.fromEntries(searchParams)}
          />
        </>
      )}
    </div>
  )
}

// 1 đơn: ảnh nhỏ · tên khóa + mã đơn, ngày, cách trả · số tiền + trạng thái · nút theo trạng thái
function OrderRow({ order }: { order: OrderType }) {
  const courseHref = `/courses/${generateSlugUrl({ name: order.course.title, id: order.course.id })}`
  // Nút chính: chờ → thanh toán tiếp; đã trả → vào học; đã hủy → xem lại khóa (mua lại)
  const action =
    order.status === OrderStatus.PENDING
      ? { href: `/checkout/${order.id}`, label: 'Thanh toán', variant: 'default' as const }
      : order.status === OrderStatus.PAID
        ? { href: `/learn/${order.course.id}`, label: 'Vào học', variant: 'outline' as const }
        : { href: courseHref, label: 'Xem khóa học', variant: 'ghost' as const }

  return (
    <li className='flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center'>
      <Link href={courseHref} className='w-full shrink-0 overflow-hidden rounded-xl sm:w-36'>
        <CourseCover course={order.course} size='sm' sizes='144px' />
      </Link>
      <div className='flex min-w-0 flex-1 flex-col gap-1'>
        <Link href={courseHref} className='line-clamp-1 font-semibold hover:text-primary'>
          {order.course.title}
        </Link>
        <p className='text-sm text-muted-foreground'>
          <span className='font-mono'>{order.code}</span> · {formatDate(order.createdAt)}
          {order.method && ` · ${PaymentMethodLabels[order.method]}`}
        </p>
      </div>
      <div className='flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-1'>
        <span className='font-bold text-highlight'>{formatPrice(order.amount)}</span>
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', statusStyles[order.status])}>
          {OrderStatusLabels[order.status]}
        </span>
      </div>
      <Button asChild variant={action.variant} className='rounded-full sm:w-32'>
        <Link href={action.href}>{action.label}</Link>
      </Button>
    </li>
  )
}

export function MyOrdersSkeleton() {
  return (
    <div className='flex flex-col gap-3'>
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className='h-24 rounded-2xl' />
      ))}
    </div>
  )
}
