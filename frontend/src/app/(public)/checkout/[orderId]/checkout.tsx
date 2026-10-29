'use client'

import CourseCover from '@/components/course-cover'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { OrderStatus, PaymentMethodLabels } from '@/constants/type'
import { formatDate, formatPrice, generateSlugUrl } from '@/lib/format'
import { HttpError } from '@/lib/http'
import { cn, handleErrorApi } from '@/lib/utils'
import {
  useCancelOrderMutation,
  useOrderQuery,
  usePaymentMethodsQuery,
  useStartPaymentMutation
} from '@/queries/useOrder'
import { StartPaymentBodyType, StartPaymentResType } from '@/schemaValidations/order.schema'
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Globe,
  Landmark,
  Loader2,
  LucideIcon,
  ShieldCheck,
  Wallet,
  XCircle
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

type Method = StartPaymentBodyType['method']
type Transfer = NonNullable<StartPaymentResType['data']['transfer']>

// MoMo từ chối giao dịch dưới 10.000 đ (backend cũng chặn, ở đây ẩn sẵn cho người dùng đỡ bấm nhầm)
const MOMO_MIN_AMOUNT = 10_000

// Icon + mô tả ngắn của từng cổng (tên lấy từ PaymentMethodLabels)
const methodInfo: Record<Method, { Icon: LucideIcon; description: string }> = {
  MOMO: { Icon: Wallet, description: 'Thẻ ATM nội địa qua cổng MoMo (môi trường thử nghiệm)' },
  PAYPAL: { Icon: Globe, description: 'Tài khoản PayPal hoặc thẻ quốc tế, thanh toán bằng USD' },
  SEPAY: { Icon: Landmark, description: 'Quét mã QR bằng app ngân hàng, xác nhận tự động' }
}

// Trang thanh toán 1 đơn hàng:
//   PENDING   → chọn cổng → MoMo / PayPal: chuyển sang trang của cổng; SePay: hiện mã QR ngay tại đây
//   PAID      → báo thành công + nút vào học
//   CANCELLED → báo đã hủy + nút mua lại
export default function Checkout({ orderId }: { orderId: number }) {
  const [method, setMethod] = useState<Method>()
  // Thông tin chuyển khoản SePay (có giá trị = đang hiện mã QR, chờ người mua chuyển khoản)
  const [transfer, setTransfer] = useState<Transfer | null>(null)

  // Đang hiện mã QR SePay (transfer khác null) → cứ 5 giây hỏi lại trạng thái đơn, PAID thì trang tự đổi sang "thành công"
  const orderQuery = useOrderQuery(orderId, transfer !== null)
  const methodsQuery = usePaymentMethodsQuery()
  const payMutation = useStartPaymentMutation()
  const cancelMutation = useCancelOrderMutation()

  if (orderQuery.isLoading) return <CheckoutSkeleton />

  const order = orderQuery.data?.payload.data
  if (orderQuery.isError || !order) {
    const notFound = orderQuery.error instanceof HttpError && orderQuery.error.status === 404
    return (
      <StatusCard
        Icon={XCircle}
        tone='error'
        title={notFound ? 'Không tìm thấy đơn hàng' : 'Không tải được đơn hàng'}
        description={notFound ? 'Đơn hàng không tồn tại hoặc không phải của bạn.' : 'Vui lòng thử lại sau.'}
        action={{ href: '/my-orders', label: 'Xem lịch sử mua hàng' }}
      />
    )
  }

  const courseHref = `/courses/${generateSlugUrl({ name: order.course.title, id: order.course.id })}`

  if (order.status === OrderStatus.PAID) {
    return (
      <StatusCard
        Icon={CheckCircle2}
        tone='success'
        title='Thanh toán thành công'
        description={`Bạn đã sở hữu khóa "${order.course.title}". Chúc bạn học tốt!`}
        action={{ href: `/learn/${order.course.id}`, label: 'Vào học ngay' }}
      />
    )
  }

  if (order.status === OrderStatus.CANCELLED) {
    return (
      <StatusCard
        Icon={XCircle}
        tone='muted'
        title='Đơn hàng đã bị hủy'
        description='Đơn đã hủy hoặc quá 24 giờ chưa thanh toán. Bạn có thể mua lại khóa học bất cứ lúc nào.'
        action={{ href: courseHref, label: 'Mua lại khóa học' }}
      />
    )
  }

  const methods = methodsQuery.data?.payload.data ?? []
  const isMethodDisabled = (m: Method) => m === 'MOMO' && order.amount < MOMO_MIN_AMOUNT

  const pay = async () => {
    if (!method || payMutation.isPending) return
    try {
      const result = await payMutation.mutateAsync({ id: order.id, body: { method } })
      // MoMo / PayPal trả payUrl → chuyển hẳn sang trang của cổng (web khác nên không dùng router.push).
      // SePay trả transfer → lưu vào state, trang hiện mã QR ngay tại chỗ
      const { payUrl, transfer } = result.payload.data
      if (payUrl) {
        window.location.href = payUrl
      } else if (transfer) {
        setTransfer(transfer)
      }
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  const cancel = async () => {
    if (cancelMutation.isPending) return
    if (!window.confirm('Hủy đơn hàng này?')) return
    try {
      // Hook đã invalidate ['orders'] → trang tự tải lại, đơn thành CANCELLED → hiện thẻ "đã hủy"
      const result = await cancelMutation.mutateAsync(orderId)
      toast.success(result.payload.message)
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-1'>
        <Link
          href={courseHref}
          className='flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='size-4' /> Quay lại khóa học
        </Link>
        <h1 className='text-3xl font-bold'>Thanh toán</h1>
      </div>

      {/* Máy tính: cách thanh toán bên trái, tóm tắt đơn bên phải. Điện thoại: tóm tắt đơn lên trước (order-first) */}
      <div className='grid gap-6 lg:grid-cols-[1fr_380px]'>
        <section className='flex flex-col gap-4 rounded-3xl border bg-card p-5 md:p-6'>
          {transfer ? (
            <SepayTransfer transfer={transfer} onBack={() => setTransfer(null)} />
          ) : (
            <>
              <h2 className='text-lg font-semibold'>Chọn cách thanh toán</h2>
              {methodsQuery.isLoading ? (
                <Skeleton className='h-48 rounded-2xl' />
              ) : methods.length === 0 ? (
                <p className='rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground'>
                  Hiện chưa có cổng thanh toán nào được bật. Vui lòng quay lại sau.
                </p>
              ) : (
                // radio thật (ẩn đi) bên trong label: bấm cả ô là chọn, bàn phím / trình đọc màn hình dùng được
                <div role='radiogroup' aria-label='Cách thanh toán' className='flex flex-col gap-3'>
                  {methods.map((m) => {
                    const { Icon, description } = methodInfo[m]
                    const disabled = isMethodDisabled(m)
                    const checked = method === m
                    return (
                      <label
                        key={m}
                        className={cn(
                          'flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring',
                          checked ? 'border-primary bg-primary/5' : 'hover:border-primary/40',
                          disabled && 'cursor-not-allowed opacity-50'
                        )}
                      >
                        <input
                          type='radio'
                          name='method'
                          value={m}
                          checked={checked}
                          disabled={disabled}
                          onChange={() => setMethod(m)}
                          className='sr-only'
                        />
                        <span
                          className={cn(
                            'flex size-11 shrink-0 items-center justify-center rounded-xl',
                            checked ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                          )}
                        >
                          <Icon className='size-5' />
                        </span>
                        <span className='flex flex-1 flex-col'>
                          <span className='font-semibold'>{PaymentMethodLabels[m]}</span>
                          <span className='text-sm text-muted-foreground'>
                            {disabled ? 'Chỉ nhận đơn từ 10.000 đ' : description}
                          </span>
                        </span>
                        {/* Vòng tròn chọn */}
                        <span
                          aria-hidden
                          className={cn(
                            'size-5 shrink-0 rounded-full border-2',
                            checked ? 'border-primary bg-primary shadow-[inset_0_0_0_3px_var(--card)]' : 'border-input'
                          )}
                        />
                      </label>
                    )
                  })}
                </div>
              )}

              <Button
                size='lg'
                className='h-12 rounded-full text-base'
                onClick={pay}
                disabled={!method || payMutation.isPending}
              >
                {payMutation.isPending && <Loader2 className='animate-spin' />}
                Thanh toán {formatPrice(order.amount)}
              </Button>
              <p className='flex items-center justify-center gap-1.5 text-xs text-muted-foreground'>
                <ShieldCheck className='size-4 text-emerald-500' />
                Thanh toán qua cổng chính thức, EduPlatform không lưu thông tin thẻ của bạn
              </p>
            </>
          )}
        </section>

        {/* ===== Tóm tắt đơn ===== */}
        <aside className='order-first flex h-fit flex-col gap-4 rounded-3xl border bg-card p-5 lg:order-0'>
          <CourseCover course={order.course} sizes='380px' className='rounded-2xl' />
          <h2 className='font-heading text-lg font-semibold'>{order.course.title}</h2>
          <dl className='flex flex-col gap-2 border-t pt-4 text-sm'>
            <div className='flex justify-between gap-4'>
              <dt className='text-muted-foreground'>Mã đơn</dt>
              <dd className='font-mono font-medium'>{order.code}</dd>
            </div>
            <div className='flex justify-between gap-4'>
              <dt className='text-muted-foreground'>Ngày tạo</dt>
              <dd>{formatDate(order.createdAt)}</dd>
            </div>
            <div className='flex items-baseline justify-between gap-4 border-t pt-3'>
              <dt className='font-medium'>Tổng cộng</dt>
              <dd className='text-2xl font-bold text-highlight'>{formatPrice(order.amount)}</dd>
            </div>
          </dl>
          <p className='text-xs text-muted-foreground'>Đơn chưa thanh toán sẽ tự hủy sau 24 giờ.</p>
          <Button
            variant='ghost'
            className='text-muted-foreground hover:text-destructive'
            onClick={cancel}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending && <Loader2 className='animate-spin' />}
            Hủy đơn hàng
          </Button>
        </aside>
      </div>
    </div>
  )
}

// Mã QR + thông tin chuyển khoản SePay. Trạng thái đơn được hỏi lại định kỳ (useOrderQuery với poll):
// tiền về → backend nhận webhook → đơn PAID → trang tự đổi sang thẻ "thành công"
function SepayTransfer({ transfer, onBack }: { transfer: Transfer; onBack: () => void }) {
  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    toast.success('Đã sao chép')
  }

  const rows: { label: string; value: string; copyable?: boolean; important?: boolean }[] = [
    { label: 'Ngân hàng', value: transfer.bank },
    { label: 'Số tài khoản', value: transfer.accountNumber, copyable: true },
    ...(transfer.accountName ? [{ label: 'Chủ tài khoản', value: transfer.accountName }] : []),
    { label: 'Số tiền', value: formatPrice(transfer.amount), copyable: true },
    { label: 'Nội dung', value: transfer.content, copyable: true, important: true }
  ]

  return (
    <div className='flex flex-col gap-5'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='text-lg font-semibold'>Chuyển khoản ngân hàng</h2>
        <Button variant='ghost' size='sm' onClick={onBack}>
          Chọn cách khác
        </Button>
      </div>

      <div className='grid items-center gap-6 md:grid-cols-[240px_1fr]'>
        {/* Ảnh QR từ vietqr.app: unoptimized → trình duyệt tải thẳng, không qua máy chủ tối ưu ảnh của Next */}
        <Image
          src={transfer.qrUrl}
          alt='Mã QR chuyển khoản'
          width={240}
          height={240}
          unoptimized
          className='mx-auto rounded-2xl border bg-white p-2'
        />
        <dl className='flex flex-col gap-3 text-sm'>
          {rows.map(({ label, value, copyable, important }) => (
            <div
              key={label}
              className={cn(
                'flex items-center justify-between gap-3 rounded-xl px-3 py-2',
                important ? 'bg-highlight/10 ring-1 ring-highlight/30' : 'bg-muted/60'
              )}
            >
              <dt className='text-muted-foreground'>{label}</dt>
              <dd className={cn('flex items-center gap-2 font-semibold', important && 'font-mono text-highlight')}>
                {value}
                {copyable && (
                  <button
                    type='button'
                    onClick={() => copy(label === 'Số tiền' ? String(transfer.amount) : value)}
                    className='text-muted-foreground hover:text-foreground'
                    aria-label={`Sao chép ${label.toLowerCase()}`}
                  >
                    <Copy className='size-4' />
                  </button>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <p className='rounded-2xl bg-accent/60 p-4 text-sm'>
        Quét mã QR bằng app ngân hàng (thông tin được điền sẵn), hoặc chuyển khoản tay với{' '}
        <span className='font-semibold'>đúng nội dung {transfer.content}</span>. Hệ thống tự xác nhận sau khi nhận được
        tiền, thường trong vòng 1 phút.
      </p>
      <p className='flex items-center justify-center gap-2 text-sm text-muted-foreground'>
        <Loader2 className='size-4 animate-spin' /> Đang chờ thanh toán...
      </p>
    </div>
  )
}

// Thẻ trạng thái giữa trang: thành công / đã hủy / lỗi. Dùng lại ở trang kết quả
export function StatusCard({
  Icon,
  tone,
  title,
  description,
  action,
  iconClassName,
  children
}: {
  Icon: LucideIcon
  iconClassName?: string // vd 'animate-spin' cho icon đang tải
  tone: 'success' | 'muted' | 'error' | 'pending'
  title: string
  description: string
  action?: { href: string; label: string }
  children?: React.ReactNode
}) {
  return (
    <div className='mx-auto flex w-full max-w-lg flex-col items-center gap-3 rounded-3xl border bg-card px-6 py-12 text-center'>
      <span
        className={cn(
          'flex size-16 items-center justify-center rounded-2xl',
          tone === 'success' && 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
          tone === 'error' && 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
          tone === 'muted' && 'bg-muted text-muted-foreground',
          tone === 'pending' && 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'
        )}
      >
        <Icon className={cn('size-8', iconClassName)} />
      </span>
      <h1 className='mt-2 text-2xl font-bold'>{title}</h1>
      <p className='text-muted-foreground'>{description}</p>
      {action && (
        <Button asChild size='lg' className='mt-3 rounded-full px-6'>
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
      {children}
    </div>
  )
}

export function CheckoutSkeleton() {
  return (
    <div className='flex flex-col gap-6'>
      <Skeleton className='h-10 w-48' />
      <div className='grid gap-6 lg:grid-cols-[1fr_380px]'>
        <Skeleton className='h-96 rounded-3xl' />
        <Skeleton className='h-96 rounded-3xl' />
      </div>
    </div>
  )
}
