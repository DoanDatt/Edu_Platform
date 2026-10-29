'use client'

import CourseCover from '@/components/course-cover'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useMyEnrollmentQuery } from '@/queries/useEnrollments'
import { MyEnrollmentType } from '@/schemaValidations/enrollment.schema'
import { ArrowRight, BookOpen, CheckCircle2, LucideIcon, PlayCircle, Sparkles, Trophy } from 'lucide-react'
import { useState } from 'react'
import { Link } from '@/i18n/navigation'

// Trạng thái học của 1 khóa, tính từ % tiến độ
type LearningStatus = 'not-started' | 'in-progress' | 'completed'
const getStatus = (percent: number): LearningStatus =>
  percent === 0 ? 'not-started' : percent === 100 ? 'completed' : 'in-progress'

// Các tab lọc. 'all' = không lọc
const tabs: { value: LearningStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'in-progress', label: 'Đang học' },
  { value: 'not-started', label: 'Chưa bắt đầu' },
  { value: 'completed', label: 'Hoàn thành' }
]

// Danh sách khóa đã ghi danh. Client Component vì dùng useQuery + useState (tab đang chọn).
// useQuery trả sẵn isLoading / isError → chỉ cần if, không cần try/catch hay <Suspense>
export default function MyCourses() {
  // limit 100: lấy hết 1 lần (1 người thường ghi danh ít khóa), chưa cần phân trang
  const { data, isLoading, isError } = useMyEnrollmentQuery({ limit: 100 })
  const [tab, setTab] = useState<LearningStatus | 'all'>('all')

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
      <div className='flex flex-col items-center gap-2 rounded-3xl border border-dashed bg-card px-4 py-16 text-center'>
        <span className='flex size-16 items-center justify-center rounded-2xl bg-primary/10'>
          <BookOpen className='size-8 text-primary' />
        </span>
        <p className='mt-3 font-heading text-lg font-semibold'>Bạn chưa ghi danh khóa học nào</p>
        <p className='max-w-sm text-sm text-muted-foreground'>Tìm một khóa học phù hợp và bắt đầu học ngay hôm nay.</p>
        <Button asChild className='mt-3 rounded-full'>
          <Link href='/courses'>
            Khám phá khóa học <ArrowRight />
          </Link>
        </Button>
      </div>
    )
  }

  // 4. Có dữ liệu: đếm theo trạng thái (dùng cho ô tổng kết + số trên tab)
  const counts = { all: enrollments.length, 'not-started': 0, 'in-progress': 0, completed: 0 }
  for (const enrollment of enrollments) counts[getStatus(enrollment.progress.percent)]++
  const lecturesDone = enrollments.reduce((sum, e) => sum + e.progress.completedLectures, 0)

  // Khóa "học tiếp": đang học dở và gần xong nhất (động lực học nốt). Không có thì lấy khóa chưa bắt đầu
  const inProgress = enrollments.filter((e) => getStatus(e.progress.percent) === 'in-progress')
  const spotlight =
    inProgress.toSorted((a, b) => b.progress.percent - a.progress.percent)[0] ??
    enrollments.find((e) => e.progress.percent === 0)

  const visible = tab === 'all' ? enrollments : enrollments.filter((e) => getStatus(e.progress.percent) === tab)

  const summary: { Icon: LucideIcon; value: number; label: string }[] = [
    { Icon: BookOpen, value: counts.all, label: 'Đã ghi danh' },
    { Icon: PlayCircle, value: counts['in-progress'], label: 'Đang học' },
    { Icon: Trophy, value: counts.completed, label: 'Hoàn thành' },
    { Icon: CheckCircle2, value: lecturesDone, label: 'Bài đã học' }
  ]

  return (
    <div className='flex flex-col gap-8'>
      {/* Ô tổng kết */}
      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        {summary.map(({ Icon, value, label }) => (
          <div key={label} className='flex items-center gap-3 rounded-2xl border bg-card p-4'>
            <span className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'>
              <Icon className='size-5' />
            </span>
            <div className='flex flex-col'>
              <span className='font-heading text-2xl font-bold'>{value}</span>
              <span className='text-sm text-muted-foreground'>{label}</span>
            </div>
          </div>
        ))}
      </div>

      {spotlight && <SpotlightCard enrollment={spotlight} />}

      <section className='flex flex-col gap-5'>
        {/* Nút lọc: chỉ lọc dữ liệu đã có trên trình duyệt, không gọi lại API.
            aria-pressed: trình đọc màn hình biết nút nào đang bật */}
        <div role='group' aria-label='Lọc theo trạng thái' className='flex flex-wrap gap-2'>
          {tabs.map(({ value, label }) => (
            <button
              key={value}
              type='button'
              aria-pressed={tab === value}
              onClick={() => setTab(value)}
              className={cn(
                'flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                tab === value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              {label}
              <span
                className={cn(
                  'rounded-full px-1.5 text-xs tabular-nums',
                  tab === value ? 'bg-white/25' : 'bg-muted text-foreground'
                )}
              >
                {counts[value]}
              </span>
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className='rounded-2xl border border-dashed bg-card px-4 py-10 text-center text-sm text-muted-foreground'>
            Không có khóa học nào ở mục này.
          </p>
        ) : (
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {visible.map((enrollment) => (
              <MyCourseCard key={enrollment.course.id} enrollment={enrollment} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// Thanh tiến độ: nền nhạt, phần đã học là dải gradient xanh (hoàn thành: xanh lá).
// role / aria-*: trình đọc màn hình đọc được "67%"
function ProgressBar({ percent, label, className }: { percent: number; label: string; className?: string }) {
  return (
    <div
      className={cn('h-2 overflow-hidden rounded-full bg-foreground/10', className)}
      role='progressbar'
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn(
          'h-full rounded-full',
          percent === 100 ? 'bg-emerald-500' : 'bg-linear-to-r from-sky-400 to-primary'
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

// Thẻ ngang to "Học tiếp": ảnh bìa trái, thông tin + nút phải (điện thoại: xếp dọc)
function SpotlightCard({ enrollment }: { enrollment: MyEnrollmentType }) {
  const { course, progress } = enrollment
  const href = `/learn/${course.id}`
  const isStarted = progress.percent > 0

  return (
    <section className='grid overflow-hidden rounded-3xl border bg-card shadow-sm md:grid-cols-[minmax(0,2fr)_3fr]'>
      {/* Máy tính: ảnh bìa cao bằng cột thông tin bên cạnh (h-full). Điện thoại: giữ tỉ lệ 16:9 */}
      <Link href={href} className='group block'>
        <CourseCover course={course} sizes='(min-width: 768px) 40vw, 100vw' className='md:h-full' />
      </Link>
      <div className='flex flex-col justify-center gap-4 p-6 md:p-8'>
        <span className='flex items-center gap-2 text-xs font-semibold tracking-widest text-highlight uppercase'>
          <Sparkles className='size-4' />
          {isStarted ? 'Học tiếp' : 'Bắt đầu ngay'}
        </span>
        <div className='flex flex-col gap-1'>
          <Link href={href} className='font-heading text-2xl font-semibold hover:text-primary'>
            {course.title}
          </Link>
          <p className='text-muted-foreground'>{course.instructor.name}</p>
        </div>
        <div className='flex flex-col gap-2'>
          <ProgressBar percent={progress.percent} label={`Tiến độ ${course.title}`} className='h-2.5' />
          <p className='text-sm text-muted-foreground'>
            Đã học <span className='font-semibold text-foreground'>{progress.completedLectures}</span>/
            {progress.totalLectures} bài · <span className='font-semibold text-primary'>{progress.percent}%</span>
          </p>
        </div>
        <Button asChild size='lg' className='w-fit rounded-full px-6'>
          <Link href={href}>
            {isStarted ? 'Tiếp tục học' : 'Bắt đầu học'} <ArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  )
}

// Thẻ 1 khóa đã ghi danh. Khác CourseCard: có tiến độ, không có giá / đánh giá
function MyCourseCard({ enrollment }: { enrollment: MyEnrollmentType }) {
  const { course, progress } = enrollment
  const href = `/learn/${course.id}`
  const status = getStatus(progress.percent)
  const isCompleted = status === 'completed'

  // Chữ trên nút theo tiến độ
  const actionLabel = status === 'not-started' ? 'Bắt đầu học' : isCompleted ? 'Xem lại' : 'Tiếp tục học'

  return (
    <div className='group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10'>
      <Link href={href} className='relative'>
        <CourseCover course={course} sizes='(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw' />
        {/* Huy hiệu hoàn thành ở góc ảnh bìa */}
        {isCompleted && (
          <span className='absolute top-3 right-3 flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white shadow-md'>
            <Trophy className='size-3.5' /> Hoàn thành
          </span>
        )}
      </Link>

      <div className='flex flex-1 flex-col gap-3 p-4'>
        <div className='flex flex-col gap-1'>
          <Link href={href} className='line-clamp-2 leading-snug font-semibold transition-colors hover:text-primary'>
            {course.title}
          </Link>
          <p className='text-sm text-muted-foreground'>{course.instructor.name}</p>
        </div>

        {/* mt-auto: đẩy phần tiến độ + nút xuống đáy thẻ → các thẻ thẳng hàng dù tên dài ngắn khác nhau */}
        <div className='mt-auto flex flex-col gap-3'>
          <div className='flex flex-col gap-1.5'>
            <ProgressBar percent={progress.percent} label={`Tiến độ ${course.title}`} />
            <div className='flex items-center justify-between text-xs text-muted-foreground'>
              <span>
                {progress.completedLectures}/{progress.totalLectures} bài
              </span>
              <span className={cn('font-semibold tabular-nums', isCompleted ? 'text-emerald-600' : 'text-primary')}>
                {progress.percent}%
              </span>
            </div>
          </div>

          <Button asChild variant={isCompleted ? 'outline' : 'default'} className='w-full rounded-full'>
            <Link href={href}>{actionLabel}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

function MyCoursesSkeleton() {
  return (
    <div className='flex flex-col gap-8'>
      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className='h-20 rounded-2xl' />
        ))}
      </div>
      <Skeleton className='h-64 rounded-3xl' />
      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className='flex flex-col overflow-hidden rounded-2xl border bg-card'>
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
    </div>
  )
}
