import courseApiRequest from '@/apiRequests/course'
import CourseCard from './course-card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, SearchX } from 'lucide-react'
import Link from 'next/link'

const PAGE_SIZE = 12

export default async function CourseList() {
  let result
  try {
    result = (await courseApiRequest.list({ limit: PAGE_SIZE })).payload
  } catch {
    return (
      <p className='rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive'>
        Không tải được danh sách khóa học. Vui lòng thử lại sau
      </p>
    )
  }

  const { data: courses, totalItems } = result

  // Không có khóa nào (thường do bộ lọc quá hẹp): khung viền nét đứt + icon + gợi ý
  if (courses.length === 0) {
    return (
      <div className='flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-16 text-center'>
        <span className='flex size-14 items-center justify-center rounded-full bg-muted'>
          <SearchX className='size-7 text-muted-foreground' />
        </span>
        <p className='mt-2 font-semibold'>Không tìm thấy khóa học phù hợp</p>
        <p className='max-w-sm text-sm text-muted-foreground'>
          Thử đổi từ khóa, bỏ bớt bộ lọc hoặc xem tất cả khóa học.
        </p>
        <Button asChild variant='outline' className='mt-3'>
          <Link href='/courses'>Xem tất cả khóa học</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6'>
      <p className='text-sm text-muted-foreground'>Tìm thấy {totalItems} khóa học</p>
      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
      {/* ===== Phân trang (chưa hoạt động): đang ở trang 1 / 2 ===== */}
      <nav aria-label='Phân trang' className='flex items-center justify-center gap-1'>
        <Button variant='outline' size='icon' disabled aria-label='Trang trước'>
          <ChevronLeft />
        </Button>
        <Button size='icon' aria-current='page'>
          1
        </Button>
        <Button variant='outline' size='icon'>
          2
        </Button>
        <Button variant='outline' size='icon' aria-label='Trang sau'>
          <ChevronRight />
        </Button>
      </nav>
    </div>
  )
}
