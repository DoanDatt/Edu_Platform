import categoryApiRequest from '@/apiRequests/category'
import { Skeleton } from '@/components/ui/skeleton'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import CourseFilters from './course-filters'
import CourseList, { CourseListSkeleton } from './course-list'

export const metadata: Metadata = {
  title: 'Khóa học',
  description: 'Khám phá các khóa học lập trình, thiết kế, marketing, khoa học dữ liệu trên EduPlatform'
}

// Lấy danh mục ở server rồi đưa cho bộ lọc (bộ lọc là Client Component, không tự gọi API)
async function CategoryFilters() {
  const categories = await categoryApiRequest
    .list({ limit: 100 })
    .then((res) => res.payload.data)
    .catch(() => []) // lỗi thì vẫn hiện bộ lọc, chỉ thiếu danh sách danh mục
  return <CourseFilters categories={categories} />
}

// cacheComponents (Next 16): phần đọc searchParams / gọi API PHẢI nằm trong <Suspense>.
// Page KHÔNG await searchParams, chỉ truyền Promise xuống CourseList; phần tiêu đề hiện ngay,
// danh sách hiện sau khi API trả về (trong lúc chờ: skeleton)
export default function CoursesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-1'>
        <h1 className='text-3xl font-bold tracking-tight'>Khóa học</h1>
        <p className='text-muted-foreground'>Học theo tốc độ của bạn, từ cơ bản đến nâng cao.</p>
      </div>

      {/* Bộ lọc dùng useSearchParams → cũng phải nằm trong Suspense */}
      <Suspense fallback={<Skeleton className='h-10 w-full' />}>
        <CategoryFilters />
      </Suspense>

      <Suspense fallback={<CourseListSkeleton />}>
        <CourseList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
