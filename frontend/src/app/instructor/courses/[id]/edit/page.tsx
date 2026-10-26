import categoryApiRequest from '@/apiRequests/category'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { CourseFormSkeleton } from '../../course-form'
import EditCourse from './edit-course'

export const metadata: Metadata = {
  title: 'Sửa khóa học'
}

// /instructor/courses/15/edit
// Server: kiểm tra id + lấy danh mục. Khóa học lấy ở client (của riêng giảng viên, cần token trong localStorage)
async function EditCourseLoader({ params }: { params: Promise<{ id: string }> }) {
  const courseId = Number((await params).id)
  if (!Number.isInteger(courseId) || courseId <= 0) notFound()

  const categories = await categoryApiRequest
    .list({ limit: 100 })
    .then((res) => res.payload.data)
    .catch(() => [])
  return <EditCourse courseId={courseId} categories={categories} />
}

export default function EditCoursePage({ params }: PageProps<'/instructor/courses/[id]/edit'>) {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-1'>
        <Link
          href='/instructor/courses'
          className='flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='size-4' />
          Khóa học của tôi
        </Link>
        <h1 className='text-2xl font-semibold tracking-tight'>Sửa thông tin khóa học</h1>
      </div>
      {/* params là dữ liệu lúc chạy → bọc Suspense */}
      <Suspense fallback={<CourseFormSkeleton />}>
        <EditCourseLoader params={params} />
      </Suspense>
    </div>
  )
}
