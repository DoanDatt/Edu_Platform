import courseApiRequest from '@/apiRequests/course'
import CourseCard from './course-card'
import { Button } from '@/components/ui/button'
import { SearchX } from 'lucide-react'
import Link from 'next/link'
import { GetCoursesQuery } from '@/schemaValidations/course.schema'
import CoursePagination from './course-pagination'

const PAGE_SIZE = 12
type SearchParams = Record<string, string | string[] | undefined>
// Hàm này gặp mảng thì trả về phần tử đầu, gặp chuỗi hoặc undefined thì trả về nguyên giá trị đó
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

export default async function CourseList({ searchParams }: { searchParams: Promise<SearchParams> }) {
  // raw.page có thể là: undefined | '2' | 'abc' | ['1', '2'] (khi URL là ?page=1&page=2)
  const raw = await searchParams
  const parsed = GetCoursesQuery.safeParse({
    search: first(raw.search),
    page: first(raw.page),
    categoryId: first(raw.categoryId),
    level: first(raw.level),
    price: first(raw.price),
    sort: first(raw.sort)
  })
  const query = parsed.success ? parsed.data : undefined
  let result
  try {
    result = (await courseApiRequest.list({ ...query, limit: PAGE_SIZE })).payload
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
      <CoursePagination page={result.page} totalPages={result.totalPages} searchParams={raw} />
    </div>
  )
}
