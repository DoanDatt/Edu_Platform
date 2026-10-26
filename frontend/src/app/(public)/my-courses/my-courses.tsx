'use client'

import CourseCover from '@/components/course-cover'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyEnrollmentQuery } from '@/queries/useEnrollments'
import { MyEnrollmentType } from '@/schemaValidations/enrollment.schema'
import { BookOpen } from 'lucide-react'
import Link from 'next/link'

// Danh sách khóa đã ghi danh. Client Component vì dùng useQuery.
// useQuery trả sẵn isLoading / isError → chỉ cần if, không cần try/catch hay <Suspense>
export default function MyCourses() {
  // limit 100: lấy hết 1 lần (1 người thường ghi danh ít khóa), chưa cần phân trang
  const { data, isLoading, isError } = useMyEnrollmentQuery({ limit: 100 })

  // 1. Đang tải lần đầu (chưa có dữ liệu trong cache)
  if (isLoading) return <MyCoursesSkeleton />

  // 2. Lỗi (backend sập, mất mạng...). 401 thì http.ts đã tự đăng xuất trước đó
  if (isError || !data) {
    return (
      <p className='rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive'>
        Không tải được danh sách khóa học. Vui lòng thử lại sau.
      </p>
    )
  }

  // data = response của http.get → { status, payload }; danh sách nằm trong payload.data
  const enrollments = data.payload.data

  // 3. Chưa ghi danh khóa nào
  if (enrollments.length === 0) {
    return (
      <div className='flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-16 text-center'>
        <span className='flex size-14 items-center justify-center rounded-full bg-muted'>
          <BookOpen className='size-7 text-muted-foreground' />
        </span>
        <p className='mt-2 font-semibold'>Bạn chưa ghi danh khóa học nào</p>
        <p className='max-w-sm text-sm text-muted-foreground'>Tìm một khóa học phù hợp và bắt đầu học ngay hôm nay.</p>
        <Button asChild className='mt-3'>
          <Link href='/courses'>Khám phá khóa học</Link>
        </Button>
      </div>
    )
  }

  // 4. Có dữ liệu
  return (
    <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
      {enrollments.map((enrollment) => (
        <MyCourseCard key={enrollment.course.id} enrollment={enrollment} />
      ))}
    </div>
  )
}

// Thẻ 1 khóa đã ghi danh. Khác CourseCard: có tiến độ, không có giá / đánh giá
function MyCourseCard({ enrollment }: { enrollment: MyEnrollmentType }) {
  const { course, progress } = enrollment
  const href = `/learn/${course.id}`
  const isCompleted = progress.percent === 100

  // Chữ trên nút theo tiến độ
  const actionLabel = progress.percent === 0 ? 'Bắt đầu học' : isCompleted ? 'Xem lại' : 'Tiếp tục học'

  return (
    <div className='flex flex-col overflow-hidden rounded-2xl bg-muted/70 dark:bg-card'>
      <Link href={href} className='group'>
        <CourseCover course={course} sizes='(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw' />
      </Link>

      <div className='flex flex-1 flex-col gap-3 p-4'>
        <div className='flex flex-col gap-1'>
          <Link href={href} className='line-clamp-2 font-semibold leading-snug hover:text-primary'>
            {course.title}
          </Link>
          <p className='text-sm text-muted-foreground'>{course.instructor.name}</p>
        </div>

        {/* mt-auto: đẩy phần tiến độ + nút xuống đáy thẻ → các thẻ thẳng hàng dù tên dài ngắn khác nhau */}
        <div className='mt-auto flex flex-col gap-3'>
          <div className='flex flex-col gap-1.5'>
            {/* Thanh tiến độ: nền xám, bên trong thanh màu dài bằng percent%
                role / aria-*: trình đọc màn hình đọc được "67%" */}
            <div
              className='h-2 overflow-hidden rounded-full bg-foreground/10'
              role='progressbar'
              aria-valuenow={progress.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Tiến độ ${course.title}`}
            >
              <div
                className={isCompleted ? 'h-full rounded-full bg-green-500' : 'h-full rounded-full bg-primary'}
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <div className='flex items-center justify-between text-xs text-muted-foreground'>
              <span>
                {progress.completedLectures}/{progress.totalLectures} bài
              </span>
              {isCompleted ? (
                <Badge variant='secondary'>Hoàn thành</Badge>
              ) : (
                <span className='tabular-nums'>{progress.percent}%</span>
              )}
            </div>
          </div>

          <Button asChild variant={isCompleted ? 'outline' : 'default'} className='w-full'>
            <Link href={href}>{actionLabel}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

function MyCoursesSkeleton() {
  return (
    <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className='flex flex-col overflow-hidden rounded-xl border'>
          <Skeleton className='aspect-video rounded-none' />
          <div className='flex flex-col gap-3 p-4'>
            <Skeleton className='h-5 w-3/4' />
            <Skeleton className='h-4 w-1/3' />
            <Skeleton className='h-2 w-full' />
            <Skeleton className='h-9 w-full' />
          </div>
        </div>
      ))}
    </div>
  )
}
