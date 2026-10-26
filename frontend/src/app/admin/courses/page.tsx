import { Skeleton } from '@/components/ui/skeleton'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import AdminCourses from './admin-courses'

export const metadata: Metadata = {
  title: 'Khóa học'
}

// /admin/courses?status=PENDING&search=react&page=2 → bộ lọc nằm trên URL (giống bảng của giảng viên)
export default function AdminCoursesPage() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>Khóa học</h1>
        <p className='text-muted-foreground'>Duyệt khóa học giảng viên gửi lên, gỡ khóa vi phạm khỏi trang công khai.</p>
      </div>
      {/* AdminCourses dùng useSearchParams (dữ liệu lúc chạy) → bọc Suspense */}
      <Suspense fallback={<Skeleton className='h-96 w-full rounded-xl' />}>
        <AdminCourses />
      </Suspense>
    </div>
  )
}
