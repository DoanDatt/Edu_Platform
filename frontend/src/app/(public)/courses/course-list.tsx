import courseApiRequest from '@/apiRequests/course'
import { Skeleton } from '@/components/ui/skeleton'
import { GetCoursesQuery } from '@/schemaValidations/course.schema'
import { SearchX } from 'lucide-react'
import CourseCard from './course-card'
import CoursePagination from './course-pagination'

type SearchParams = Record<string, string | string[] | undefined>

const PAGE_SIZE = 12 // lưới 4 cột x 3 hàng

// ?level=A&level=B → lấy giá trị đầu
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

// Server Component, async: đọc URL → gọi API → hiện danh sách.
// Nằm trong <Suspense> ở page.tsx (bắt buộc với cacheComponents, vì đọc searchParams và gọi API)
export default async function CourseList({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const raw = await searchParams

  // Chỉ lấy đúng các tham số đã biết (GetCoursesQuery dùng .strict(), gặp ?utm_source=... sẽ lỗi).
  // z.coerce đổi '2' → 2. URL sai (?level=abc) thì bỏ qua bộ lọc, hiện tất cả, KHÔNG làm sập trang
  const parsed = GetCoursesQuery.safeParse({
    search: first(raw.search),
    categoryId: first(raw.categoryId),
    level: first(raw.level),
    price: first(raw.price),
    sort: first(raw.sort),
    page: first(raw.page)
  })
  const query = parsed.success ? parsed.data : undefined

  let result
  try {
    result = (await courseApiRequest.list({ ...query, limit: PAGE_SIZE })).payload
  } catch {
    return (
      <p className='rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive'>
        Không tải được danh sách khóa học. Vui lòng thử lại sau.
      </p>
    )
  }

  if (result.data.length === 0) {
    return (
      <div className='flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center'>
        <SearchX className='size-10 text-muted-foreground' />
        <p className='font-medium'>Không tìm thấy khóa học phù hợp</p>
        <p className='text-sm text-muted-foreground'>Thử đổi từ khóa hoặc bỏ bớt bộ lọc.</p>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6'>
      <p className='text-sm text-muted-foreground'>Tìm thấy {result.totalItems} khóa học</p>
      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {result.data.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
      <CoursePagination page={result.page} totalPages={result.totalPages} searchParams={raw} />
    </div>
  )
}

// Hiện trong lúc chờ API (fallback của <Suspense>): khung xám có hình dạng giống thẻ thật
export function CourseListSkeleton() {
  return (
    <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className='flex flex-col gap-3 overflow-hidden rounded-xl border'>
          <Skeleton className='aspect-video rounded-none' />
          <div className='flex flex-col gap-2 p-4'>
            <Skeleton className='h-4 w-1/3' />
            <Skeleton className='h-5 w-full' />
            <Skeleton className='h-4 w-1/2' />
            <Skeleton className='mt-2 h-5 w-1/4' />
          </div>
        </div>
      ))}
    </div>
  )
}
