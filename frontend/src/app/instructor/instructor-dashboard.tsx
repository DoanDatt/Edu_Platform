'use client'

import CourseStatusBadge from '@/components/course-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CourseStatus } from '@/constants/type'
import { useInstructorStatsQuery } from '@/queries/useStats'
import { BookOpen, Clock, LucideIcon, Star, Users } from 'lucide-react'
import Link from 'next/link'

// Client Component + useQuery: số liệu RIÊNG của giảng viên, không cần SEO,
// và đổi theo thao tác (tạo khóa, gửi duyệt xong → invalidate ['stats'] là tự cập nhật)
export default function InstructorDashboard() {
  const { data, isLoading, isError } = useInstructorStatsQuery()

  if (isLoading) return <DashboardSkeleton />
  if (isError || !data) {
    return (
      <p className='rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive'>
        Không tải được số liệu. Vui lòng thử lại sau.
      </p>
    )
  }

  const stats = data.payload.data

  return (
    <div className='flex flex-col gap-6'>
      {/* ===== Thẻ số liệu ===== */}
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard title='Tổng khóa học' value={stats.courses.total} Icon={BookOpen} />
        <StatCard title='Học viên' value={stats.totalStudents} Icon={Users} />
        <StatCard
          title='Đánh giá trung bình'
          value={stats.reviews.total > 0 ? stats.reviews.averageRating : '—'}
          note={`${stats.reviews.total} đánh giá`}
          Icon={Star}
        />
        <StatCard
          title='Chờ duyệt'
          value={stats.courses.byStatus.PENDING}
          note={stats.courses.byStatus.REJECTED > 0 ? `${stats.courses.byStatus.REJECTED} khóa bị từ chối` : undefined}
          Icon={Clock}
        />
      </div>

      {/* ===== Số khóa theo trạng thái ===== */}
      <Card>
        <CardHeader>
          <CardTitle>Khóa học theo trạng thái</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-wrap gap-3'>
          {/* Object.values(CourseStatus): đi qua đủ 4 trạng thái theo đúng thứ tự khai báo */}
          {Object.values(CourseStatus).map((status) => (
            <div key={status} className='flex items-center gap-2 rounded-lg border px-3 py-2'>
              <CourseStatusBadge status={status} />
              <span className='font-semibold tabular-nums'>{stats.courses.byStatus[status]}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ===== Khóa nổi bật ===== */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between gap-4'>
          <div className='flex flex-col gap-1.5'>
            <CardTitle>Khóa học nổi bật</CardTitle>
            <CardDescription>Các khóa có nhiều học viên nhất</CardDescription>
          </div>
          <Button asChild variant='outline' size='sm'>
            <Link href='/instructor/courses'>Xem tất cả</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {stats.topCourses.length === 0 ? (
            <div className='flex flex-col items-center gap-3 py-8 text-center'>
              <p className='text-muted-foreground'>Bạn chưa có khóa học nào.</p>
              <Button asChild>
                <Link href='/instructor/courses'>Tạo khóa học đầu tiên</Link>
              </Button>
            </div>
          ) : (
            // overflow-x-auto: màn hình hẹp thì bảng cuộn ngang, không đẩy vỡ trang
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b text-left text-muted-foreground'>
                    <th className='py-2 pr-4 font-medium'>Khóa học</th>
                    <th className='py-2 pr-4 font-medium'>Trạng thái</th>
                    <th className='py-2 pr-4 text-right font-medium'>Học viên</th>
                    <th className='py-2 text-right font-medium'>Đánh giá</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topCourses.map((course) => (
                    <tr key={course.id} className='border-b last:border-0'>
                      <td className='py-3 pr-4 font-medium'>{course.title}</td>
                      <td className='py-3 pr-4'>
                        <CourseStatusBadge status={course.status} />
                      </td>
                      <td className='py-3 pr-4 text-right tabular-nums'>{course.studentCount}</td>
                      <td className='py-3 text-right tabular-nums'>{course.reviewCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  title,
  value,
  note,
  Icon
}: {
  title: string
  value: number | string
  note?: string
  Icon: LucideIcon
}) {
  return (
    <Card>
      <CardContent className='flex items-start justify-between gap-4'>
        <div className='flex flex-col gap-1'>
          <span className='text-sm text-muted-foreground'>{title}</span>
          <span className='text-3xl font-bold tabular-nums'>{value}</span>
          {note && <span className='text-xs text-muted-foreground'>{note}</span>}
        </div>
        <span className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
          <Icon className='size-5' />
        </span>
      </CardContent>
    </Card>
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
      <Skeleton className='h-28 rounded-xl' />
      <Skeleton className='h-64 rounded-xl' />
    </div>
  )
}
