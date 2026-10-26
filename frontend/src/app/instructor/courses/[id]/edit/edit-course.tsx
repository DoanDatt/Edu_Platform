'use client'

import CourseStatusBadge from '@/components/course-status-badge'
import { Button } from '@/components/ui/button'
import { CourseStatus } from '@/constants/type'
import { formatDate } from '@/lib/format'
import { useInstructorCourseDetailQuery } from '@/queries/useCourse'
import { CategoryType } from '@/schemaValidations/category.schema'
import { AlertCircle, Clock, Globe, ListTree } from 'lucide-react'
import Link from 'next/link'
import CourseForm, { CourseFormSkeleton } from '../../course-form'
import CourseLoadError from '../../course-load-error'
import CourseNotice from '../../course-notice'

// Giống ProfileForm: tầng ngoài lo đang tải / lỗi, có dữ liệu rồi mới tạo CourseForm
// → defaultValues điền thẳng dữ liệu cũ, không cần useEffect + form.reset
export default function EditCourse({ courseId, categories }: { courseId: number; categories: CategoryType[] }) {
  const { data, isLoading, isError, error } = useInstructorCourseDetailQuery(courseId)

  if (isLoading) return <CourseFormSkeleton />
  if (isError || !data) return <CourseLoadError error={error} />

  const course = data.payload.data

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex flex-wrap items-center gap-3 text-sm text-muted-foreground'>
          <CourseStatusBadge status={course.status} />
          <span>Cập nhật lần cuối {formatDate(course.updatedAt)}</span>
        </div>
        <Button asChild variant='outline' size='sm'>
          <Link href={`/instructor/courses/${course.id}`}>
            <ListTree />
            Soạn nội dung
          </Link>
        </Button>
      </div>

      {/* Thông báo theo trạng thái (backend: sửa được khi DRAFT / REJECTED / PUBLISHED) */}
      {course.status === CourseStatus.REJECTED && course.rejectReason && (
        <CourseNotice tone='destructive' Icon={AlertCircle}>
          <span className='font-medium'>Lý do từ chối:</span> {course.rejectReason}. Sửa xong hãy gửi duyệt lại.
        </CourseNotice>
      )}
      {course.status === CourseStatus.PUBLISHED && (
        <CourseNotice Icon={Globe}>Khóa học đang công khai: thay đổi sẽ hiển thị ngay cho học viên.</CourseNotice>
      )}

      {course.status === CourseStatus.PENDING ? (
        // Đang chờ duyệt: backend trả 409 nếu sửa → không hiện form luôn, khỏi để người dùng nhập rồi mới báo lỗi
        <CourseNotice Icon={Clock}>Khóa học đang chờ admin duyệt nên tạm thời không thể chỉnh sửa.</CourseNotice>
      ) : (
        // key: sang khóa khác (id khác) thì tạo form MỚI, không giữ dữ liệu của khóa trước
        <CourseForm key={course.id} categories={categories} course={course} />
      )}
    </div>
  )
}
