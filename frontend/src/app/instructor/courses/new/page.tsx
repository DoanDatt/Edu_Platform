import categoryApiRequest from '@/apiRequests/category'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import CourseForm, { CourseFormSkeleton } from '../course-form'

export const metadata: Metadata = {
  title: 'Tạo khóa học'
}

// Server: lấy danh mục (công khai, ít đổi) rồi truyền vào form → không cần viết thêm hook danh mục.
// Lỗi thì trả mảng rỗng: form vẫn hiện, ô danh mục trống và báo lỗi khi bấm Tạo
async function NewCourseForm() {
  const categories = await categoryApiRequest
    .list({ limit: 100 })
    .then((res) => res.payload.data)
    .catch(() => [])
  return <CourseForm categories={categories} />
}

export default function NewCoursePage() {
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
        <h1 className='text-2xl font-semibold tracking-tight'>Tạo khóa học</h1>
        <p className='text-muted-foreground'>
          Khóa học mới ở trạng thái Nháp. Soạn chương, bài giảng xong thì gửi admin duyệt.
        </p>
      </div>
      {/* fetch không cache = dữ liệu lúc chạy → bọc Suspense (cacheComponents) */}
      <Suspense fallback={<CourseFormSkeleton />}>
        <NewCourseForm />
      </Suspense>
    </div>
  )
}
