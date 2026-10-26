import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import CourseCurriculum, { CurriculumSkeleton } from './course-curriculum'

export const metadata: Metadata = {
  title: 'Soạn nội dung khóa học'
}

// /instructor/courses/15 → trang chính của 1 khóa: soạn chương + bài giảng
async function CurriculumLoader({ params }: { params: Promise<{ id: string }> }) {
  const courseId = Number((await params).id)
  if (!Number.isInteger(courseId) || courseId <= 0) notFound()
  return <CourseCurriculum courseId={courseId} />
}

export default function CourseCurriculumPage({ params }: PageProps<'/instructor/courses/[id]'>) {
  return (
    <div className='flex flex-col gap-6'>
      <Link
        href='/instructor/courses'
        className='flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground'
      >
        <ArrowLeft className='size-4' />
        Khóa học của tôi
      </Link>
      <Suspense fallback={<CurriculumSkeleton />}>
        <CurriculumLoader params={params} />
      </Suspense>
    </div>
  )
}
