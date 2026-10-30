import courseApiRequest from '@/apiRequests/course'
import CourseCard from './course-card'
import CourseRow from './course-row'
import { Button } from '@/components/ui/button'
import { SearchX } from 'lucide-react'
import { GetCoursesQuery } from '@/schemaValidations/course.schema'
import PaginationLinks from '@/components/pagination-links'
import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'

const PAGE_SIZE = 10
type SearchParams = Record<string, string | string[] | undefined>
// Hàm này gặp mảng thì trả về phần tử đầu, gặp chuỗi hoặc undefined thì trả về nguyên giá trị đó
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

// Các tham số bộ lọc đọc từ URL (cột lọc + ô tìm kiếm + sort). view (lưới / danh sách) chỉ là cách hiển thị
const QUERY_KEYS = ['search', 'page', 'categoryId', 'instructorId', 'level', 'price', 'rating', 'sort'] as const

export default async function CourseList({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const t = await getTranslations('Courses')
  const raw = await searchParams
  // URL người dùng gõ tay có thể sai (?page=abc, ?level=XYZ) → safeParse, sai thì coi như không lọc
  const parsed = GetCoursesQuery.safeParse(Object.fromEntries(QUERY_KEYS.map((key) => [key, first(raw[key])])))
  const query = parsed.success ? parsed.data : undefined
  const view = first(raw.view) === 'grid' ? 'grid' : 'list'

  let result
  try {
    result = (await courseApiRequest.list({ ...query, limit: PAGE_SIZE })).payload
  } catch {
    return (
      <p className='rounded-[20px] border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive'>
        {t('loadError')}
      </p>
    )
  }

  const { data: courses, totalItems } = result

  // Không có khóa nào (thường do bộ lọc quá hẹp): khung viền nét đứt + icon + gợi ý
  if (courses.length === 0) {
    return (
      <div className='flex flex-col items-center gap-2 rounded-[20px] border border-dashed px-4 py-16 text-center'>
        <span className='flex size-14 items-center justify-center rounded-full bg-muted'>
          <SearchX className='size-7 text-muted-foreground' />
        </span>
        <p className='mt-2 font-semibold'>{t('emptyTitle')}</p>
        <p className='max-w-sm text-sm text-muted-foreground'>{t('emptyDescription')}</p>
        <Button asChild variant='bordered' size='pill' className='mt-3'>
          <Link href='/courses'>{t('viewAll')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-[30px]'>
      <p className='-mt-2 text-base text-muted-foreground'>{t('found', { count: totalItems })}</p>
      {view === 'grid' ? (
        <div className='grid gap-[30px] sm:grid-cols-2 xl:grid-cols-3'>
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className='flex flex-col gap-[30px]'>
          {courses.map((course) => (
            <CourseRow key={course.id} course={course} />
          ))}
        </div>
      )}
      <PaginationLinks pathname='/courses' page={result.page} totalPages={result.totalPages} searchParams={raw} />
    </div>
  )
}
