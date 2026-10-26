'use client'

import CourseStatusBadge from '@/components/course-status-badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CourseStatus } from '@/constants/type'
import { formatDuration } from '@/lib/format'
import { handleErrorApi, moveItem } from '@/lib/utils'
import { useInstructorCourseDetailQuery } from '@/queries/useCourse'
import { useCreateSectionMutation, useReorderSectionsMutation } from '@/queries/useSection'
import { InstructorLectureType } from '@/schemaValidations/section.schema'
import { AlertCircle, Clock, Layers, Pencil } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import CourseLoadError from '../course-load-error'
import CourseNotice from '../course-notice'
import LectureSheet, { LectureTarget } from './lecture-sheet'
import SectionItem, { TitleForm } from './section-item'

// Trang soạn nội dung. Toàn bộ mục lục nằm trong 1 query ['courses', 'mine', id]:
// thêm / sửa / xóa / đổi thứ tự chương hay bài xong → invalidate → query tải lại → giao diện tự cập nhật.
// Không tự sửa mảng sections trong state: luôn hiển thị đúng thứ tự server đã lưu
export default function CourseCurriculum({ courseId }: { courseId: number }) {
  const { data, isLoading, isError, error } = useInstructorCourseDetailQuery(courseId)
  const createSectionMutation = useCreateSectionMutation()
  const reorderSectionsMutation = useReorderSectionsMutation()
  // Bài đang mở trong khung soạn bài (Sheet). null = đóng
  const [lectureTarget, setLectureTarget] = useState<LectureTarget | null>(null)

  if (isLoading) return <CurriculumSkeleton />
  if (isError || !data) return <CourseLoadError error={error} />

  const course = data.payload.data
  // Chờ duyệt: backend không cho sửa (409) → chỉ xem, ẩn mọi nút thao tác
  const editable = course.status !== CourseStatus.PENDING
  const lectures = course.sections.flatMap((section) => section.lectures)
  const totalDuration = lectures.reduce((sum, lecture) => sum + lecture.durationSec, 0)

  // Lên / xuống 1 chương: gửi ĐỦ id các chương theo thứ tự mới (API reorder yêu cầu vậy)
  const moveSection = async (index: number, direction: -1 | 1) => {
    const ids = course.sections.map((section) => section.id)
    try {
      await reorderSectionsMutation.mutateAsync({ courseId, sectionIds: moveItem(ids, index, index + direction) })
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  const createSection = async (title: string) => {
    await createSectionMutation.mutateAsync({ courseId, title })
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* ===== Tiêu đề + tổng quan ===== */}
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='flex min-w-0 flex-col gap-2'>
          <h1 className='text-2xl font-semibold tracking-tight'>{course.title}</h1>
          <div className='flex flex-wrap items-center gap-3 text-sm text-muted-foreground'>
            <CourseStatusBadge status={course.status} />
            <span>
              {course.sections.length} chương · {lectures.length} bài giảng · {formatDuration(totalDuration)}
            </span>
          </div>
        </div>
        {editable && (
          <Button asChild variant='outline'>
            <Link href={`/instructor/courses/${course.id}/edit`}>
              <Pencil />
              Sửa thông tin
            </Link>
          </Button>
        )}
      </div>

      {course.status === CourseStatus.PENDING && (
        <CourseNotice Icon={Clock}>Khóa học đang chờ admin duyệt nên tạm thời không thể chỉnh sửa nội dung.</CourseNotice>
      )}
      {course.status === CourseStatus.REJECTED && course.rejectReason && (
        <CourseNotice tone='destructive' Icon={AlertCircle}>
          <span className='font-medium'>Lý do từ chối:</span> {course.rejectReason}
        </CourseNotice>
      )}

      {/* ===== Danh sách chương ===== */}
      {course.sections.length === 0 ? (
        <div className='flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-12 text-center'>
          <Layers className='size-10 text-muted-foreground' />
          <p className='font-medium'>Khóa học chưa có chương nào</p>
          <p className='max-w-sm text-sm text-muted-foreground'>
            Chia khóa học thành các chương (ví dụ: Giới thiệu, Cơ bản, Dự án), rồi thêm bài giảng vào từng chương.
          </p>
        </div>
      ) : (
        <div className='flex flex-col gap-4'>
          {course.sections.map((section, index) => (
            <SectionItem
              key={section.id}
              section={section}
              index={index}
              isFirst={index === 0}
              isLast={index === course.sections.length - 1}
              editable={editable}
              onMove={(direction) => moveSection(index, direction)}
              onAddLecture={() => setLectureTarget({ sectionId: section.id })}
              onEditLecture={(lecture: InstructorLectureType) => setLectureTarget({ sectionId: section.id, lecture })}
            />
          ))}
        </div>
      )}

      {editable && (
        <div className='rounded-xl border border-dashed p-4'>
          <p className='mb-3 text-sm font-medium'>Thêm chương mới</p>
          <TitleForm placeholder='Tên chương, ví dụ: Giới thiệu khóa học' submitLabel='Thêm chương' onSubmit={createSection} />
        </div>
      )}

      <LectureSheet target={lectureTarget} onClose={() => setLectureTarget(null)} />
    </div>
  )
}

export function CurriculumSkeleton() {
  return (
    <div className='flex flex-col gap-4'>
      <Skeleton className='h-14 w-2/3 rounded-lg' />
      <Skeleton className='h-48 rounded-xl' />
      <Skeleton className='h-48 rounded-xl' />
    </div>
  )
}
