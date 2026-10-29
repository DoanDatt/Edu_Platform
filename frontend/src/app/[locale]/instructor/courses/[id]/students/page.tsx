import { Skeleton } from '@/components/ui/skeleton'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import CourseStudents from './course-students'

export const metadata: Metadata = {
  title: 'Học viên của khóa học'
}

// /instructor/courses/15/students?page=2
async function StudentsLoader({ params }: { params: Promise<{ id: string }> }) {
  const courseId = Number((await params).id)
  if (!Number.isInteger(courseId) || courseId <= 0) notFound()
  return <CourseStudents courseId={courseId} />
}

export default function CourseStudentsPage({ params }: PageProps<'/[locale]/instructor/courses/[id]/students'>) {
  return (
    // Suspense: params (ở đây) và useSearchParams (trong CourseStudents) đều là dữ liệu lúc chạy
    <Suspense fallback={<Skeleton className='h-96 w-full rounded-xl' />}>
      <StudentsLoader params={params} />
    </Suspense>
  )
}
