'use client'

import CourseCover from '@/components/course-cover'
import CourseLoadError from '@/components/course-load-error'
import CourseNotice from '@/components/course-notice'
import CourseStatusBadge from '@/components/course-status-badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CourseLevelLabels, CourseStatus } from '@/constants/type'
import { formatDate, formatDuration, formatPrice, generateSlugUrl } from '@/lib/format'
import { handleErrorApi } from '@/lib/utils'
import {
  useAdminCourseDetailQuery,
  useApproveCourseMutation,
  useRejectCourseMutation,
  useUnpublishCourseMutation
} from '@/queries/useCourse'
import { AdminCourseDetailType } from '@/schemaValidations/course.schema'
import { AlertCircle, Check, Clock, ExternalLink, FileEdit, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import AdminCurriculum from './admin-curriculum'
import ReasonForm from './reason-form'
import { Link } from '@/i18n/navigation'

// Trang duyệt: bên trái là nội dung khóa (để admin xem có đạt không), bên phải là khung thao tác dính khi cuộn
export default function CourseReview({ courseId }: { courseId: number }) {
  const { data, isLoading, isError, error } = useAdminCourseDetailQuery(courseId)

  if (isLoading) return <CourseReviewSkeleton />
  if (isError || !data) return <CourseLoadError error={error} backHref='/admin/courses' />

  const course = data.payload.data
  const lectures = course.sections.flatMap((section) => section.lectures)
  const totalDuration = lectures.reduce((sum, lecture) => sum + lecture.durationSec, 0)

  return (
    <div className='grid gap-8 lg:grid-cols-[1fr_340px]'>
      <div className='flex min-w-0 flex-col gap-8'>
        <section className='flex flex-col gap-3'>
          <div className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
            <CourseStatusBadge status={course.status} />
            <span>{course.category.name}</span>
            <span>·</span>
            <span>Cập nhật {formatDate(course.updatedAt)}</span>
          </div>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>{course.title}</h1>
          {course.subtitle && <p className='text-lg text-muted-foreground'>{course.subtitle}</p>}
        </section>

        <section className='flex flex-col gap-2'>
          <h2 className='text-lg font-semibold'>Giới thiệu</h2>
          {course.description ? (
            <p className='whitespace-pre-line leading-relaxed text-muted-foreground'>{course.description}</p>
          ) : (
            <p className='text-sm text-muted-foreground italic'>Giảng viên chưa viết phần giới thiệu.</p>
          )}
        </section>

        <section className='flex flex-col gap-3'>
          <h2 className='text-lg font-semibold'>Nội dung khóa học</h2>
          <p className='text-sm text-muted-foreground'>
            {course.sections.length} chương · {lectures.length} bài giảng · {formatDuration(totalDuration)}
          </p>
          <AdminCurriculum sections={course.sections} />
        </section>
      </div>

      <aside className='flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start'>
        <div className='overflow-hidden rounded-2xl border bg-card'>
          <CourseCover course={course} sizes='340px' />
          <dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 p-4 text-sm'>
            <dt className='text-muted-foreground'>Giảng viên</dt>
            <dd className='min-w-0'>
              <p className='truncate font-medium'>{course.instructor.name}</p>
              <p className='truncate text-xs text-muted-foreground'>{course.instructor.email}</p>
            </dd>
            <dt className='text-muted-foreground'>Học phí</dt>
            <dd className='font-medium'>{formatPrice(course.price)}</dd>
            <dt className='text-muted-foreground'>Trình độ</dt>
            <dd>{CourseLevelLabels[course.level]}</dd>
            <dt className='text-muted-foreground'>Ngôn ngữ</dt>
            <dd>{course.language === 'vi' ? 'Tiếng Việt' : course.language}</dd>
          </dl>
        </div>
        {/* key: đổi trạng thái (duyệt / từ chối xong) → tạo lại khung thao tác, form lý do tự đóng */}
        <ReviewActions key={course.status} course={course} />
      </aside>
    </div>
  )
}

// Thao tác theo trạng thái (đúng luồng của backend):
//   PENDING   → Duyệt  / Từ chối (bắt buộc lý do)
//   PUBLISHED → Gỡ khóa (bắt buộc lý do) + xem trang công khai
//   REJECTED  → chỉ xem lý do, chờ giảng viên sửa và gửi lại
//   DRAFT     → giảng viên chưa gửi, chưa có gì để duyệt
function ReviewActions({ course }: { course: AdminCourseDetailType }) {
  const approveMutation = useApproveCourseMutation()
  const rejectMutation = useRejectCourseMutation()
  const unpublishMutation = useUnpublishCourseMutation()
  // Form nhập lý do đang mở hay không (Từ chối / Gỡ khóa đều cần lý do)
  const [showReason, setShowReason] = useState(false)

  const approve = async () => {
    if (!confirm(`Duyệt và xuất bản khóa "${course.title}"? Khóa sẽ hiện ngay trên trang công khai.`)) return
    try {
      const result = await approveMutation.mutateAsync(course.id)
      toast.success(result.payload.message)
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  // Từ chối và gỡ khóa cùng gửi { reason }, chỉ khác API → chọn mutation theo trạng thái
  const submitReason = async (reason: string) => {
    const mutation = course.status === CourseStatus.PUBLISHED ? unpublishMutation : rejectMutation
    const result = await mutation.mutateAsync({ id: course.id, body: { reason } })
    toast.success(result.payload.message)
  }

  if (course.status === CourseStatus.DRAFT) {
    return <CourseNotice Icon={FileEdit}>Giảng viên chưa gửi duyệt khóa học này.</CourseNotice>
  }

  if (course.status === CourseStatus.REJECTED) {
    return (
      <CourseNotice tone='destructive' Icon={AlertCircle}>
        <span className='font-medium'>Đã từ chối:</span> {course.rejectReason ?? 'Không có lý do'}. Đang chờ giảng viên
        sửa và gửi lại.
      </CourseNotice>
    )
  }

  if (course.status === CourseStatus.PUBLISHED) {
    return (
      <div className='flex flex-col gap-3 rounded-2xl border bg-card p-4'>
        <Button asChild variant='outline'>
          <Link href={`/courses/${generateSlugUrl({ name: course.title, id: course.id })}`} target='_blank'>
            <ExternalLink />
            Xem trang công khai
          </Link>
        </Button>
        {showReason ? (
          <ReasonForm
            label='Lý do gỡ khóa học'
            placeholder='Ví dụ: Video bài 3 vi phạm bản quyền...'
            submitLabel='Gỡ khóa học'
            onSubmit={submitReason}
            onCancel={() => setShowReason(false)}
          />
        ) : (
          <Button variant='outline' className='text-destructive hover:text-destructive' onClick={() => setShowReason(true)}>
            <X />
            Gỡ khỏi trang công khai
          </Button>
        )}
        <p className='text-xs text-muted-foreground'>
          Gỡ khóa: khóa chuyển sang &quot;Bị từ chối&quot;, ẩn khỏi trang công khai, giảng viên nhận email kèm lý do.
        </p>
      </div>
    )
  }

  // PENDING
  return (
    <div className='flex flex-col gap-3 rounded-2xl border bg-card p-4'>
      <p className='flex items-center gap-2 text-sm font-medium'>
        <Clock className='size-4 text-primary' />
        Khóa học đang chờ bạn duyệt
      </p>
      {showReason ? (
        <ReasonForm
          label='Lý do từ chối'
          placeholder='Ví dụ: Thiếu phần giới thiệu, video chương 2 bị lỗi...'
          submitLabel='Từ chối khóa học'
          onSubmit={submitReason}
          onCancel={() => setShowReason(false)}
        />
      ) : (
        <div className='grid grid-cols-2 gap-2'>
          <Button onClick={approve} disabled={approveMutation.isPending}>
            {approveMutation.isPending ? <Loader2 className='animate-spin' /> : <Check />}
            Duyệt
          </Button>
          <Button
            variant='outline'
            className='text-destructive hover:text-destructive'
            onClick={() => setShowReason(true)}
            disabled={approveMutation.isPending}
          >
            <X />
            Từ chối
          </Button>
        </div>
      )}
      <p className='text-xs text-muted-foreground'>Duyệt hay từ chối, giảng viên đều nhận được email thông báo.</p>
    </div>
  )
}

export function CourseReviewSkeleton() {
  return (
    <div className='grid gap-8 lg:grid-cols-[1fr_340px]'>
      <div className='flex flex-col gap-4'>
        <Skeleton className='h-5 w-48' />
        <Skeleton className='h-9 w-3/4' />
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-64 w-full rounded-xl' />
      </div>
      <Skeleton className='h-96 rounded-2xl' />
    </div>
  )
}
