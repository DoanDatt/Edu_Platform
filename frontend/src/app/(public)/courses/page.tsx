import type { Metadata } from 'next'
import CourseList from './course-list'
import { Suspense } from 'react'
import CourseFilters from './course-filter'
import categoryApiRequest from '@/apiRequests/category'
import PageBanner from '@/components/page-banner'

export const metadata: Metadata = {
  title: 'Khóa học',
  description: 'Khám phá các khóa học lập trình, thiết kế, marketing, khoa học dữ liệu trên EduPlatform'
}

async function CategoryFilters() {
  const categories = await categoryApiRequest
    .list({
      limit: 100
    })
    .then((res) => res.payload.data)
    .catch(() => [])
  return <CourseFilters categories={categories} />
}

async function CoursesPage({ searchParams }: PageProps<'/courses'>) {
  return (
    <div className='flex flex-col gap-6'>
      {/* ===== Tiêu đề ===== */}
      <PageBanner
        eyebrow='Thư viện khóa học'
        title='Khóa học'
        description='Học theo tốc độ của bạn, từ cơ bản đến nâng cao.'
      />

      {/* ===== Bộ lọc (chưa hoạt động) ===== */}
      <Suspense fallback={<div className='h-10' />}>
        <CategoryFilters />
      </Suspense>

      {/* ===== Danh sách ===== */}
      <Suspense fallback={<p className='text-muted-foreground'>Đang tải khóa học...</p>}>
        <CourseList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

export default CoursesPage
