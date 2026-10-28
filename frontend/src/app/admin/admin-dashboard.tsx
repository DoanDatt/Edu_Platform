'use client'

import StatCard from '@/components/stat-card'
import RevenueSection from './revenue-section'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CourseStatus, CourseStatusLabels, RoleLabels, RoleType } from '@/constants/type'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileEdit,
  Globe,
  GraduationCap,
  Lock,
  LucideIcon,
  Presentation,
  ShieldCheck,
  Star,
  Users,
  XCircle
} from 'lucide-react'
import Link from 'next/link'
import { useAdminStatsQuery } from '@/queries/useStats'
import { useAdminCoursesQuery } from '@/queries/useCourse'

// Thứ tự hiện vai trò cố định (backend trả object, thứ tự key không đảm bảo)
const ROLE_ORDER: RoleType[] = ['STUDENT', 'INSTRUCTOR', 'ADMIN']

// Icon + màu nền icon cho từng ô. Viết đủ tên class để Tailwind tạo được CSS (không ghép chuỗi)
const roleStyles: Record<RoleType, { Icon: LucideIcon; className: string }> = {
  STUDENT: { Icon: GraduationCap, className: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400' },
  INSTRUCTOR: {
    Icon: Presentation,
    className: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400'
  },
  ADMIN: { Icon: ShieldCheck, className: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400' }
}

const courseStatusStyles: Record<keyof typeof CourseStatus, { Icon: LucideIcon; className: string }> = {
  DRAFT: { Icon: FileEdit, className: 'bg-muted text-muted-foreground' },
  PENDING: { Icon: Clock, className: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400' },
  PUBLISHED: { Icon: Globe, className: 'bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400' },
  REJECTED: { Icon: XCircle, className: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400' }
}

// Phần trăm làm tròn, tổng bằng 0 thì 0% (tránh chia cho 0)
const percent = (value: number, total: number) => (total === 0 ? 0 : Math.round((value / total) * 100))

export default function AdminDashboard() {
  const { data, isLoading, isError } = useAdminStatsQuery()
  const stats = data?.payload.data

  const pendingQuery = useAdminCoursesQuery({ status: CourseStatus.PENDING, limit: 5 })
  const pendingCourses = pendingQuery.data?.payload.data ?? []

  if (isLoading) return <DashboardSkeleton />
  if (isError || !stats) {
    return (
      <p className='rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive'>
        Không tải được số liệu. Vui lòng thử lại sau.
      </p>
    )
  }

  const pendingCount = stats.courses.byStatus.PENDING

  return (
    <div className='flex flex-col gap-6'>
      {/* ===== Thẻ số liệu ===== */}
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard
          title='Người dùng'
          value={stats.users.total}
          note={`+${stats.users.newLast30Days} trong 30 ngày`}
          Icon={Users}
        />
        <StatCard
          title='Khóa học'
          value={stats.courses.total}
          note={`${stats.courses.byStatus.PUBLISHED} đã xuất bản`}
          Icon={BookOpen}
        />
        <StatCard
          title='Lượt ghi danh'
          value={stats.enrollments.total}
          note={`+${stats.enrollments.newLast30Days} trong 30 ngày`}
          Icon={GraduationCap}
        />
        <StatCard
          title='Đánh giá trung bình'
          value={stats.reviews.total > 0 ? stats.reviews.averageRating : '—'}
          note={`${stats.reviews.total} đánh giá`}
          Icon={Star}
        />
      </div>

      {/* ===== Doanh thu (giao diện mẫu, chờ phần thanh toán) ===== */}
      <RevenueSection />

      <div className='grid gap-6 lg:grid-cols-[1fr_360px]'>
        {/* ===== Cần xử lý: khóa chờ duyệt ===== */}
        <Card>
          <CardHeader className='flex flex-row items-start justify-between gap-4'>
            <div className='flex flex-col gap-1.5'>
              <CardTitle className='flex items-center gap-2'>
                <ClipboardCheck className='size-5 text-primary' />
                Cần xử lý
              </CardTitle>
              <CardDescription>
                {pendingCount > 0 ? `${pendingCount} khóa học đang chờ duyệt` : 'Không có khóa học nào chờ duyệt'}
              </CardDescription>
            </div>
            {pendingCount > 0 && (
              <Button asChild variant='outline' size='sm'>
                <Link href='/admin/courses?status=PENDING'>Xem tất cả</Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {pendingCount === 0 ? (
              <div className='flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground'>
                <CheckCircle2 className='size-8 text-green-600 dark:text-green-400' />
                Đã duyệt hết, không còn việc tồn đọng.
              </div>
            ) : (
              <ul className='divide-y'>
                {pendingCourses.map((course) => (
                  <li key={course.id} className='flex items-center gap-3 py-3 first:pt-0 last:pb-0'>
                    <div className='flex min-w-0 flex-1 flex-col'>
                      <span className='truncate font-medium'>{course.title}</span>
                      <span className='truncate text-xs text-muted-foreground'>
                        {course.instructor.name} · gửi {formatDate(course.updatedAt)}
                      </span>
                    </div>
                    <Button asChild size='sm'>
                      <Link href={`/admin/courses/${course.id}`}>Duyệt</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ===== Người dùng theo vai trò ===== */}
        <Card>
          <CardHeader>
            <CardTitle>Người dùng theo vai trò</CardTitle>
            <CardDescription>Tổng {stats.users.total} tài khoản</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-3'>
            {ROLE_ORDER.map((role) => {
              const { Icon, className } = roleStyles[role]
              const count = stats.users.byRole[role] ?? 0
              return (
                <MiniStat
                  key={role}
                  Icon={Icon}
                  iconClassName={className}
                  label={RoleLabels[role]}
                  value={count}
                  note={`${percent(count, stats.users.total)}%`}
                />
              )
            })}
            {stats.users.blocked > 0 && (
              <Link
                href='/admin/users?status=BLOCKED'
                className='flex items-center gap-2 text-sm text-destructive hover:underline'
              >
                <Lock className='size-4' />
                {stats.users.blocked} tài khoản đang bị khóa
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===== Khóa học theo trạng thái ===== */}
      <Card>
        <CardHeader>
          <CardTitle>Khóa học theo trạng thái</CardTitle>
          <CardDescription>Bấm vào một trạng thái để xem danh sách</CardDescription>
        </CardHeader>
        {/* 4 ô cạnh nhau (điện thoại 2 ô / hàng), mỗi ô bấm sang bảng khóa học đã lọc sẵn trạng thái đó */}
        <CardContent className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          {Object.values(CourseStatus).map((status) => {
            const { Icon, className } = courseStatusStyles[status]
            const count = stats.courses.byStatus[status]
            return (
              <MiniStat
                key={status}
                Icon={Icon}
                iconClassName={className}
                label={CourseStatusLabels[status]}
                value={count}
                note={`${percent(count, stats.courses.total)}%`}
                href={`/admin/courses?status=${status}`}
              />
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

// Ô số liệu nhỏ: icon màu + tên + số to + ghi chú (tỉ lệ %). Có href thì cả ô là link
function MiniStat({
  Icon,
  iconClassName,
  label,
  value,
  note,
  href
}: {
  Icon: LucideIcon
  iconClassName: string
  label: string
  value: number
  note?: string
  href?: string
}) {
  const content = (
    <>
      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', iconClassName)}>
        <Icon className='size-5' />
      </span>
      <div className='flex min-w-0 flex-1 flex-col'>
        <span className='truncate text-sm text-muted-foreground'>{label}</span>
        <span className='flex items-baseline gap-2'>
          <span className='text-2xl font-bold tabular-nums'>{value}</span>
          {note && <span className='text-xs text-muted-foreground'>{note}</span>}
        </span>
      </div>
    </>
  )
  const className = 'flex items-center gap-3 rounded-xl border p-3'
  return href ? (
    <Link href={href} className={cn(className, 'transition-colors hover:border-primary/40 hover:bg-accent')}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  )
}

function DashboardSkeleton() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className='h-28 rounded-xl' />
        ))}
      </div>
      <div className='grid gap-6 lg:grid-cols-[1fr_360px]'>
        <Skeleton className='h-72 rounded-xl' />
        <Skeleton className='h-72 rounded-xl' />
      </div>
      <Skeleton className='h-56 rounded-xl' />
    </div>
  )
}
