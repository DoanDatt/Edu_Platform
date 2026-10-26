'use client'

import CourseStatusBadge from '@/components/course-status-badge'
import { Button } from '@/components/ui/button'
import { CourseStatus } from '@/constants/type'
import { formatDate } from '@/lib/format'
import { HttpError } from '@/lib/http'
import { cn } from '@/lib/utils'
import { useInstructorCourseDetailQuery } from '@/queries/useCourse'
import { CategoryType } from '@/schemaValidations/category.schema'
import { AlertCircle, Clock, Globe, LucideIcon } from 'lucide-react'
import Link from 'next/link'
import CourseForm, { CourseFormSkeleton } from '../../course-form'

// Giống ProfileForm: tầng ngoài lo đang tải / lỗi, có dữ liệu rồi mới tạo CourseForm
// → defaultValues điền thẳng dữ liệu cũ, không cần useEffect + form.reset
export default function EditCourse({ courseId, categories }: { courseId: number; categories: CategoryType[] }) {
  const { data, isLoading, isError, error } = useInstructorCourseDetailQuery(courseId)

  if (isLoading) return <CourseFormSkeleton />
  if (isError || !data) {
    // HttpError có status → báo đúng lý do thay vì một câu chung chung
    const status = error instanceof HttpError ? error.status : undefined
    const message =
      status === 404
        ? 'Không tìm thấy khóa học.'
        : status === 403
          ? 'Đây không phải khóa học của bạn.'
          : 'Không tải được khóa học. Vui lòng thử lại sau.'
    return (
      <div className='flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4'>
        <p className='text-sm text-destructive'>{message}</p>
        <Button asChild variant='outline' size='sm'>
          <Link href='/instructor/courses'>Về danh sách khóa học</Link>
        </Button>
      </div>
    )
  }

  const course = data.payload.data

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-center gap-3 text-sm text-muted-foreground'>
        <CourseStatusBadge status={course.status} />
        <span>Cập nhật lần cuối {formatDate(course.updatedAt)}</span>
      </div>

      {/* Thông báo theo trạng thái (backend: sửa được khi DRAFT / REJECTED / PUBLISHED) */}
      {course.status === CourseStatus.REJECTED && course.rejectReason && (
        <Notice tone='destructive' Icon={AlertCircle}>
          <span className='font-medium'>Lý do từ chối:</span> {course.rejectReason}. Sửa xong hãy gửi duyệt lại.
        </Notice>
      )}
      {course.status === CourseStatus.PUBLISHED && (
        <Notice Icon={Globe}>Khóa học đang công khai: thay đổi sẽ hiển thị ngay cho học viên.</Notice>
      )}

      {course.status === CourseStatus.PENDING ? (
        // Đang chờ duyệt: backend trả 409 nếu sửa → không hiện form luôn, khỏi để người dùng nhập rồi mới báo lỗi
        <Notice Icon={Clock}>Khóa học đang chờ admin duyệt nên tạm thời không thể chỉnh sửa.</Notice>
      ) : (
        // key: sang khóa khác (id khác) thì tạo form MỚI, không giữ dữ liệu của khóa trước
        <CourseForm key={course.id} categories={categories} course={course} />
      )}
    </div>
  )
}

function Notice({
  tone = 'default',
  Icon,
  children
}: {
  tone?: 'default' | 'destructive'
  Icon: LucideIcon
  children: React.ReactNode
}) {
  return (
    <p
      className={cn(
        'flex items-start gap-2 rounded-lg border p-3 text-sm',
        tone === 'destructive' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'bg-muted/40'
      )}
    >
      <Icon className='mt-0.5 size-4 shrink-0' />
      <span>{children}</span>
    </p>
  )
}
