import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'
import type { Metadata } from 'next'
import courseApiRequest from '@/apiRequests/course'
import CourseList from './course-list'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Khóa học',
  description: 'Khám phá các khóa học lập trình, thiết kế, marketing, khoa học dữ liệu trên EduPlatform'
}

// BẢN GIAO DIỆN TĨNH: chưa gọi API, bộ lọc và phân trang chưa hoạt động.
// Các bước bạn tự làm tiếp (theo docs/reference-courses.md):
//   1. Thay mockCourses bằng courseApiRequest.list() (tách ra CourseList, bọc <Suspense>)
//   2. Phân trang: mỗi nút là <Link> đổi ?page=
//   3. Bộ lọc: tách ra CourseFilters ('use client'), đổi URL bằng router.push
async function CoursesPage() {
  return (
    <div className='flex flex-col gap-6'>
      {/* ===== Tiêu đề ===== */}
      <div className='flex flex-col gap-1'>
        <h1 className='text-3xl font-bold tracking-tight'>Khóa học</h1>
        <p className='text-muted-foreground'>Học theo tốc độ của bạn, từ cơ bản đến nâng cao.</p>
      </div>

      {/* ===== Bộ lọc (chưa hoạt động) ===== */}
      <div className='flex flex-col gap-3 lg:flex-row lg:items-center'>
        <div className='relative flex-1'>
          <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input placeholder='Tìm khóa học, ví dụ: React' className='h-10 pl-9' aria-label='Tìm khóa học' />
        </div>

        {/* Điện thoại: 2 cột, máy tính bảng: 4 cột, máy tính: nằm cùng hàng với ô tìm kiếm */}
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex'>
          <Select defaultValue='all'>
            <SelectTrigger className='h-10 w-full lg:w-44' aria-label='Danh mục'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả danh mục</SelectItem>
              <SelectItem value='17'>Lập trình Web</SelectItem>
              <SelectItem value='18'>Thiết kế</SelectItem>
              <SelectItem value='19'>Marketing</SelectItem>
              <SelectItem value='20'>Khoa học dữ liệu</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue='all'>
            <SelectTrigger className='h-10 w-full lg:w-40' aria-label='Trình độ'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Mọi trình độ</SelectItem>
              <SelectItem value='BEGINNER'>Cơ bản</SelectItem>
              <SelectItem value='INTERMEDIATE'>Trung cấp</SelectItem>
              <SelectItem value='ADVANCED'>Nâng cao</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue='all'>
            <SelectTrigger className='h-10 w-full lg:w-36' aria-label='Giá'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Mọi mức giá</SelectItem>
              <SelectItem value='free'>Miễn phí</SelectItem>
              <SelectItem value='paid'>Có phí</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue='newest'>
            <SelectTrigger className='h-10 w-full lg:w-40' aria-label='Sắp xếp'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='newest'>Mới nhất</SelectItem>
              <SelectItem value='popular'>Nhiều học viên</SelectItem>
              <SelectItem value='price_asc'>Giá tăng dần</SelectItem>
              <SelectItem value='price_desc'>Giá giảm dần</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ===== Danh sách ===== */}
      <Suspense fallback={<p className='text-muted-foreground'>Đang tải khóa học...</p>}>
        <CourseList />
      </Suspense>
    </div>
  )
}

export default CoursesPage
