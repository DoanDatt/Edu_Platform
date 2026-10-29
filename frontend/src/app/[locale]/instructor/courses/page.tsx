import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import InstructorCourses from './instructor-courses'
import { Link } from '@/i18n/navigation'

export const metadata: Metadata = {
  title: 'Khóa học của tôi'
}

// /instructor/courses?status=DRAFT&page=2
// Bộ lọc trạng thái + trang nằm trên URL (giống /courses): F5 không mất, Back quay lại đúng chỗ
export default function InstructorCoursesPage() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-2xl font-semibold tracking-tight'>Khóa học của tôi</h1>
          <p className='text-muted-foreground'>Tạo khóa học, soạn nội dung và gửi admin duyệt.</p>
        </div>
        {/* Vòng C: form tạo khóa học */}
        <Button asChild>
          <Link href='/instructor/courses/new'>
            <Plus />
            Tạo khóa học
          </Link>
        </Button>
      </div>
      {/* InstructorCourses dùng useSearchParams (dữ liệu lúc chạy) → bọc Suspense */}
      <Suspense fallback={<Skeleton className='h-96 w-full rounded-xl' />}>
        <InstructorCourses />
      </Suspense>
    </div>
  )
}
