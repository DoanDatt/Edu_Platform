import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import CourseReview, { CourseReviewSkeleton } from './course-review'
import { Link } from '@/i18n/navigation'

export const metadata: Metadata = {
  title: 'Duyệt khóa học'
}

// /admin/courses/15 → xem toàn bộ khóa (mọi trạng thái, cả video) rồi duyệt / từ chối / gỡ
async function ReviewLoader({ params }: { params: Promise<{ id: string }> }) {
  const courseId = Number((await params).id)
  if (!Number.isInteger(courseId) || courseId <= 0) notFound()
  return <CourseReview courseId={courseId} />
}

export default function AdminCourseReviewPage({ params }: PageProps<'/[locale]/admin/courses/[id]'>) {
  return (
    <div className='flex flex-col gap-6'>
      <Link
        href='/admin/courses'
        className='flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground'
      >
        <ArrowLeft className='size-4' />
        Danh sách khóa học
      </Link>
      <Suspense fallback={<CourseReviewSkeleton />}>
        <ReviewLoader params={params} />
      </Suspense>
    </div>
  )
}
