import type { Metadata } from 'next'
import CourseList from './course-list'
import { Suspense } from 'react'
import CourseFilters from './course-filter'

export const metadata: Metadata = {
  title: 'Khóa học',
  description: 'Khám phá các khóa học lập trình, thiết kế, marketing, khoa học dữ liệu trên EduPlatform'
}
async function CoursesPage({ searchParams }: PageProps<'/courses'>) {
  return (
    <div className='flex flex-col gap-6'>
      {/* ===== Tiêu đề ===== */}
      <div className='flex flex-col gap-1'>
        <h1 className='text-3xl font-bold tracking-tight'>Khóa học</h1>
        <p className='text-muted-foreground'>Học theo tốc độ của bạn, từ cơ bản đến nâng cao.</p>
      </div>

      {/* ===== Bộ lọc (chưa hoạt động) ===== */}
      <Suspense fallback={<div className='h-10' />}>
        <CourseFilters />
      </Suspense>

      {/* ===== Danh sách ===== */}
      <Suspense fallback={<p className='text-muted-foreground'>Đang tải khóa học...</p>}>
        <CourseList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

export default CoursesPage
