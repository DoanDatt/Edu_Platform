import { Skeleton } from '@/components/ui/skeleton'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import AdminCategories from './admin-categories'

export const metadata: Metadata = {
  title: 'Danh mục'
}

// /admin/categories?page=2
export default function AdminCategoriesPage() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>Danh mục</h1>
        <p className='text-muted-foreground'>
          Nhóm các khóa học theo chủ đề. Giảng viên chọn danh mục khi tạo khóa học.
        </p>
      </div>
      {/* AdminCategories dùng useSearchParams (dữ liệu lúc chạy) → bọc Suspense */}
      <Suspense fallback={<Skeleton className='h-96 w-full rounded-xl' />}>
        <AdminCategories />
      </Suspense>
    </div>
  )
}
