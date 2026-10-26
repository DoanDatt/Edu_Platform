'use client'

import CourseCover from '@/components/course-cover'
import CourseStatusBadge from '@/components/course-status-badge'
import PaginationLinks from '@/components/pagination-links'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CourseStatus, CourseStatusLabels } from '@/constants/type'
import { formatDate, formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAdminCoursesQuery } from '@/queries/useCourse'
import { AdminCourseType, GetAdminCoursesQuery } from '@/schemaValidations/course.schema'
import { BookOpen, Eye, Loader2, Search } from 'lucide-react'
import Form from 'next/form'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const PAGE_SIZE = 10
const PATHNAME = '/admin/courses'

// "Chờ duyệt" đứng ngay sau "Tất cả": việc chính của admin ở trang này
const TABS: { label: string; status?: keyof typeof CourseStatus }[] = [
  { label: 'Tất cả' },
  { label: CourseStatusLabels.PENDING, status: CourseStatus.PENDING },
  { label: CourseStatusLabels.PUBLISHED, status: CourseStatus.PUBLISHED },
  { label: CourseStatusLabels.REJECTED, status: CourseStatus.REJECTED },
  { label: CourseStatusLabels.DRAFT, status: CourseStatus.DRAFT }
]

export default function AdminCourses() {
  const searchParams = useSearchParams()
  const parsed = GetAdminCoursesQuery.safeParse({
    search: searchParams.get('search') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    page: searchParams.get('page') ?? undefined
  })
  const { search, status, page } = parsed.success ? parsed.data : { search: undefined, status: undefined, page: 1 }

  const { data, isLoading, isError, isFetching } = useAdminCoursesQuery({ search, status, page, limit: PAGE_SIZE })

  // Đổi tab: giữ từ khóa tìm kiếm, bỏ page (lọc mới thì về trang 1)
  const tabHref = (tabStatus?: string) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (tabStatus) params.set('status', tabStatus)
    const query = params.toString()
    return query ? `${PATHNAME}?${query}` : PATHNAME
  }

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <div className='flex flex-wrap items-center gap-2'>
          {TABS.map((tab) => (
            <Button key={tab.label} asChild size='sm' variant={tab.status === status ? 'default' : 'outline'}>
              <Link href={tabHref(tab.status)} aria-current={tab.status === status ? 'page' : undefined}>
                {tab.label}
              </Link>
            </Button>
          ))}
          {isFetching && !isLoading && <Loader2 className='size-4 animate-spin text-muted-foreground' />}
        </div>

        {/* Form GET của Next: Enter → /admin/courses?search=...&status=... (giữ tab đang chọn bằng input ẩn).
            key: đổi URL (bấm tab, Back) thì tạo lại ô nhập để defaultValue khớp URL mới */}
        <Form key={search ?? ''} action={PATHNAME} className='relative lg:w-72'>
          {status && <input type='hidden' name='status' value={status} />}
          <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
          <input
            name='search'
            type='search'
            defaultValue={search ?? ''}
            placeholder='Tìm theo tên khóa học...'
            aria-label='Tìm khóa học'
            className='h-9 w-full rounded-lg border bg-background pr-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
          />
        </Form>
      </div>

      {isLoading ? (
        <Skeleton className='h-96 w-full rounded-xl' />
      ) : isError || !data ? (
        <p className='rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive'>
          Không tải được danh sách khóa học. Vui lòng thử lại sau.
        </p>
      ) : data.payload.data.length === 0 ? (
        <div className='flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center'>
          <BookOpen className='size-10 text-muted-foreground' />
          <p className='font-medium'>
            {status === CourseStatus.PENDING ? 'Không có khóa học nào đang chờ duyệt' : 'Không có khóa học phù hợp'}
          </p>
        </div>
      ) : (
        <>
          <div className={cn('overflow-x-auto rounded-xl border transition-opacity', isFetching && 'opacity-60')}>
            <table className='w-full text-sm'>
              <thead className='bg-muted/40 text-left text-muted-foreground'>
                <tr>
                  <th className='px-4 py-3 font-medium'>Khóa học</th>
                  <th className='px-4 py-3 font-medium'>Giảng viên</th>
                  <th className='px-4 py-3 font-medium'>Trạng thái</th>
                  <th className='px-4 py-3 text-right font-medium'>Học viên</th>
                  <th className='px-4 py-3 text-right font-medium'>Giá</th>
                  <th className='px-4 py-3 font-medium'>Cập nhật</th>
                  <th className='px-4 py-3'>
                    <span className='sr-only'>Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.payload.data.map((course) => (
                  <CourseRow key={course.id} course={course} />
                ))}
              </tbody>
            </table>
          </div>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <p className='text-sm text-muted-foreground'>Tổng {data.payload.totalItems} khóa học</p>
            <PaginationLinks
              pathname={PATHNAME}
              page={data.payload.page}
              totalPages={data.payload.totalPages}
              searchParams={Object.fromEntries(searchParams.entries())}
            />
          </div>
        </>
      )}
    </div>
  )
}

function CourseRow({ course }: { course: AdminCourseType }) {
  const href = `${PATHNAME}/${course.id}`
  return (
    <tr className='border-t'>
      <td className='px-4 py-3'>
        <div className='flex items-center gap-3'>
          <CourseCover course={course} size='sm' sizes='96px' className='w-24 shrink-0 rounded-md' />
          <div className='flex min-w-0 flex-col gap-0.5'>
            <Link href={href} className='line-clamp-2 font-medium hover:text-primary'>
              {course.title}
            </Link>
            <span className='text-xs text-muted-foreground'>{course.category.name}</span>
          </div>
        </div>
      </td>
      <td className='px-4 py-3'>
        <div className='flex flex-col'>
          <span>{course.instructor.name}</span>
          <span className='text-xs text-muted-foreground'>{course.instructor.email}</span>
        </div>
      </td>
      <td className='px-4 py-3'>
        <CourseStatusBadge status={course.status} />
      </td>
      <td className='px-4 py-3 text-right tabular-nums'>{course.studentCount}</td>
      <td className='px-4 py-3 text-right whitespace-nowrap tabular-nums'>{formatPrice(course.price)}</td>
      <td className='px-4 py-3 whitespace-nowrap text-muted-foreground'>{formatDate(course.updatedAt)}</td>
      <td className='px-4 py-3 text-right'>
        {/* Chờ duyệt: nút nổi bật "Duyệt" (việc cần làm). Trạng thái khác: chỉ "Xem" */}
        <Button asChild size='sm' variant={course.status === CourseStatus.PENDING ? 'default' : 'outline'}>
          <Link href={href}>
            <Eye />
            {course.status === CourseStatus.PENDING ? 'Duyệt' : 'Xem'}
          </Link>
        </Button>
      </td>
    </tr>
  )
}
