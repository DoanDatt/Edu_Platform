'use client'

import CourseStatusBadge from '@/components/course-status-badge'
import PaginationLinks from '@/components/pagination-links'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCourseStudentsQuery, useInstructorCourseDetailQuery } from '@/queries/useCourse'
import { CourseStudentType, GetCourseStudentsQuery } from '@/schemaValidations/course.schema'
import { ArrowLeft, Loader2, Users } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'

const PAGE_SIZE = 10

// Học viên của 1 khóa + tiến độ từng người. Trang trên URL (?page=2) giống bảng khóa học
export default function CourseStudents({ courseId }: { courseId: number }) {
  const searchParams = useSearchParams()
  const parsed = GetCourseStudentsQuery.safeParse({ page: searchParams.get('page') ?? undefined })
  const page = parsed.success ? parsed.data.page : 1

  // Tên + trạng thái khóa cho phần tiêu đề. Thường đã có sẵn trong cache (vừa ở trang soạn nội dung sang)
  // → hiện ngay, không gọi API lại
  const courseQuery = useInstructorCourseDetailQuery(courseId)
  const { data, isLoading, isError, isFetching } = useCourseStudentsQuery(courseId, { page, limit: PAGE_SIZE })
  const pathname = `/instructor/courses/${courseId}/students`
  const course = courseQuery.data?.payload.data

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-2'>
        <Link
          href={`/instructor/courses/${courseId}`}
          className='flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='size-4' />
          Soạn nội dung khóa học
        </Link>
        <h1 className='text-2xl font-semibold tracking-tight'>Học viên</h1>
        {course ? (
          <div className='flex flex-wrap items-center gap-3 text-sm text-muted-foreground'>
            <span className='font-medium text-foreground'>{course.title}</span>
            <CourseStatusBadge status={course.status} />
          </div>
        ) : (
          <Skeleton className='h-5 w-64' />
        )}
      </div>

      {isLoading ? (
        <Skeleton className='h-80 w-full rounded-xl' />
      ) : isError || !data ? (
        <p className='rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive'>
          Không tải được danh sách học viên. Vui lòng thử lại sau.
        </p>
      ) : data.payload.data.length === 0 ? (
        <div className='flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center'>
          <Users className='size-10 text-muted-foreground' />
          <p className='font-medium'>Chưa có học viên nào</p>
          <p className='max-w-sm text-sm text-muted-foreground'>
            Học viên ghi danh sau khi khóa học được admin duyệt và xuất bản.
          </p>
        </div>
      ) : (
        <>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            Tổng <span className='font-semibold text-foreground'>{data.payload.totalItems}</span> học viên
            {isFetching && <Loader2 className='size-4 animate-spin' />}
          </div>
          <div className={cn('overflow-x-auto rounded-xl border transition-opacity', isFetching && 'opacity-60')}>
            <table className='w-full text-sm'>
              <thead className='bg-muted/40 text-left text-muted-foreground'>
                <tr>
                  <th className='px-4 py-3 font-medium'>Học viên</th>
                  <th className='px-4 py-3 font-medium'>Ghi danh</th>
                  <th className='min-w-56 px-4 py-3 font-medium'>Tiến độ</th>
                </tr>
              </thead>
              <tbody>
                {data.payload.data.map((student) => (
                  <StudentRow key={student.user.id} student={student} />
                ))}
              </tbody>
            </table>
          </div>
          <PaginationLinks
            pathname={pathname}
            page={data.payload.page}
            totalPages={data.payload.totalPages}
            searchParams={Object.fromEntries(searchParams.entries())}
          />
        </>
      )}
    </div>
  )
}

function StudentRow({ student }: { student: CourseStudentType }) {
  const { user, progress } = student
  const isCompleted = progress.percent === 100

  return (
    <tr className='border-t'>
      <td className='px-4 py-3'>
        <div className='flex items-center gap-3'>
          <Avatar>
            <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className='flex min-w-0 flex-col'>
            <span className='truncate font-medium'>{user.name}</span>
            <span className='truncate text-xs text-muted-foreground'>{user.email}</span>
          </div>
        </div>
      </td>
      <td className='px-4 py-3 whitespace-nowrap text-muted-foreground'>{formatDate(student.enrolledAt)}</td>
      <td className='px-4 py-3'>
        {/* Thanh tiến độ giống "Khóa học của tôi": xong 100% thì màu xanh lá */}
        <div className='flex items-center gap-3'>
          <div
            className='h-2 flex-1 overflow-hidden rounded-full bg-muted'
            role='progressbar'
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Tiến độ của ${user.name}`}
          >
            <div
              className={cn('h-full rounded-full', isCompleted ? 'bg-green-500' : 'bg-primary')}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <span className='w-28 shrink-0 text-right text-xs text-muted-foreground tabular-nums'>
            {progress.completedLectures}/{progress.totalLectures} bài · {progress.percent}%
          </span>
        </div>
      </td>
    </tr>
  )
}
