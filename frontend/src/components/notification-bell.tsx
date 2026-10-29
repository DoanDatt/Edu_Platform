'use client'

import { useAppContext } from '@/components/app-provider'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { NotificationType } from '@/constants/type'
import { formatRelativeTime } from '@/lib/format'
import { cn, handleErrorApi } from '@/lib/utils'
import {
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
  useNotificationsQuery,
  useUnreadCountQuery
} from '@/queries/useNotification'
import { NotificationItemType } from '@/schemaValidations/notification.schema'
import { useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  EyeOff,
  LucideIcon,
  Send,
  ShoppingBag,
  Star,
  UserPlus,
  XCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

// Icon + màu theo loại thông báo: nhìn là biết tin tốt (xanh) hay tin xấu (đỏ)
const typeStyles: Record<keyof typeof NotificationType, { Icon: LucideIcon; className: string }> = {
  COURSE_SUBMITTED: { Icon: Send, className: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400' },
  COURSE_APPROVED: {
    Icon: CheckCircle2,
    className: 'bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400'
  },
  COURSE_REJECTED: { Icon: XCircle, className: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400' },
  COURSE_UNPUBLISHED: {
    Icon: EyeOff,
    className: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400'
  },
  NEW_ENROLLMENT: { Icon: UserPlus, className: 'bg-primary/10 text-primary' },
  NEW_REVIEW: { Icon: Star, className: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400' },
  // Có người mua khóa: tin vui về tiền → xanh lá
  NEW_ORDER: {
    Icon: ShoppingBag,
    className: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
  }
}

// Chuông thông báo ở header (trang công khai + khu giảng viên / admin). Chưa đăng nhập thì không hiện.
// Số đỏ = số chưa đọc, tự cập nhật 30 giây / lần (xem useUnreadCountQuery). Bấm chuông mới tải danh sách
export default function NotificationBell() {
  const { isAuth } = useAppContext()
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()

  const unreadQuery = useUnreadCountQuery(isAuth)
  const listQuery = useNotificationsQuery(isAuth && open)
  const markAsReadMutation = useMarkNotificationAsReadMutation()
  const markAllMutation = useMarkAllNotificationsAsReadMutation()

  const unreadCount = unreadQuery.data?.payload.data.unreadCount

  // Số chưa đọc TĂNG = vừa có thông báo mới (khóa vừa được duyệt, có học viên mới...) → dữ liệu liên quan
  // trên trang đang mở có thể đã cũ → tải lại luôn, người dùng không cần F5.
  // useRef: nhớ số lần trước mà KHÔNG gây vẽ lại. Lần đầu có dữ liệu chỉ ghi nhớ, không coi là "tăng"
  const previousCount = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (unreadCount === undefined) return
    if (previousCount.current !== undefined && unreadCount > previousCount.current) {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] })
    }
    previousCount.current = unreadCount
  }, [unreadCount, queryClient])

  if (!isAuth) return null

  const openNotification = (notification: NotificationItemType) => {
    setOpen(false)
    // Không cần chờ đánh dấu xong mới chuyển trang: lỗi thì cùng lắm thông báo vẫn hiện "chưa đọc"
    if (!notification.readAt) markAsReadMutation.mutate(notification.id)
    if (notification.link) router.push(notification.link)
  }

  const markAllAsRead = async () => {
    try {
      await markAllMutation.mutateAsync()
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  const notifications = listQuery.data?.payload.data ?? []

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='relative'
          aria-label={unreadCount ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
        >
          <Bell className='size-5' />
          {!!unreadCount && (
            <span className='absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none font-semibold text-white'>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      {/* min(): điện thoại hẹp thì menu co theo màn hình, không tràn ra ngoài */}
      <DropdownMenuContent align='end' className='w-[min(24rem,calc(100vw-2rem))] p-0'>
        <div className='flex items-center justify-between gap-2 border-b px-4 py-3'>
          <span className='font-semibold'>Thông báo</span>
          {!!unreadCount && (
            <button
              type='button'
              onClick={markAllAsRead}
              disabled={markAllMutation.isPending}
              className='flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50'
            >
              <CheckCheck className='size-3.5' />
              Đánh dấu đã đọc tất cả
            </button>
          )}
        </div>

        <div className='max-h-[min(28rem,70vh)] overflow-y-auto'>
          {listQuery.isLoading ? (
            <div className='flex flex-col gap-3 p-4'>
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className='flex gap-3'>
                  <Skeleton className='size-9 shrink-0 rounded-full' />
                  <div className='flex flex-1 flex-col gap-2'>
                    <Skeleton className='h-4 w-2/3' />
                    <Skeleton className='h-3 w-full' />
                  </div>
                </div>
              ))}
            </div>
          ) : listQuery.isError ? (
            <p className='p-4 text-sm text-destructive'>Không tải được thông báo.</p>
          ) : notifications.length === 0 ? (
            <div className='flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground'>
              <Bell className='size-8' />
              Chưa có thông báo nào
            </div>
          ) : (
            notifications.map((notification) => {
              const { Icon, className } = typeStyles[notification.type]
              const isUnread = !notification.readAt
              return (
                <DropdownMenuItem
                  key={notification.id}
                  onSelect={() => openNotification(notification)}
                  className={cn(
                    'items-start gap-3 rounded-none border-b px-4 py-3 last:border-b-0',
                    isUnread && 'bg-primary/5'
                  )}
                >
                  <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', className)}>
                    <Icon className='size-4' />
                  </span>
                  <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
                    <span className={cn('text-sm', isUnread ? 'font-semibold' : 'text-muted-foreground')}>
                      {notification.title}
                    </span>
                    <span className='line-clamp-2 text-xs text-muted-foreground'>{notification.message}</span>
                    <span className={cn('text-xs', isUnread ? 'text-primary' : 'text-muted-foreground')}>
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </div>
                  {/* Chấm xanh: chưa đọc */}
                  {isUnread && (
                    <span className='mt-1.5 size-2 shrink-0 rounded-full bg-primary' aria-label='Chưa đọc' />
                  )}
                </DropdownMenuItem>
              )
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
