'use client'

import CourseStatusBadge from '@/components/course-status-badge'
import PaginationLinks from '@/components/pagination-links'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CourseStatus, CourseStatusLabels } from '@/constants/type'
import { formatDate, formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useInstructorCourseQuery } from '@/queries/useCourse'
import { GetMyCoursesQuery, InstructorCourseType } from '@/schemaValidations/course.schema'
import { AlertCircle, BookOpen, ImageOff, ListTree, Loader2, Pencil } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const PAGE_SIZE = 10
const PATHNAME = '/instructor/courses'

// Tab lọc: "Tất cả" (không có status) + 4 trạng thái
const TABS: { label: string; status?: keyof typeof CourseStatus }[] = [
  { label: 'Tất cả' },
  ...Object.values(CourseStatus).map((status) => ({ label: CourseStatusLabels[status], status }))
]

export default function InstructorCourses() {
  const searchParams = useSearchParams()

  // Đọc URL an toàn bằng chính schema query (giống /courses): ?status=abc / ?page=-1 → bỏ qua, không gửi rác
  const parsed = GetMyCoursesQuery.safeParse({
    status: searchParams.get('status') ?? undefined,
    page: searchParams.get('page') ?? undefined
  })
  const status = parsed.success ? parsed.data.status : undefined
  const page = parsed.success ? parsed.data.page : 1

  const { data, isLoading, isError, isFetching } = useInstructorCourseQuery({ status, page, limit: PAGE_SIZE })

  // Đổi tab: chỉ giữ status, bỏ page (lọc mới thì về trang 1)
  const tabHref = (tabStatus?: string) => (tabStatus ? `${PATHNAME}?status=${tabStatus}` : PATHNAME)

  return (
    <div className='flex flex-col gap-4'>
      {/* ===== Tab trạng thái: là Link (đổi URL), không phải nút đổi state ===== */}
      <div className='flex flex-wrap items-center gap-2'>
        {TABS.map((tab) => (
          <Button
            key={tab.label}
            asChild
            size='sm'
            variant={tab.status === status ? 'default' : 'outline'}
          >
            <Link href={tabHref(tab.status)} aria-current={tab.status === status ? 'page' : undefined}>
              {tab.label}
            </Link>
          </Button>
        ))}
        {/* isFetching: đang tải trang / tab mới (bảng cũ vẫn hiện nhờ keepPreviousData) */}
        {isFetching && !isLoading && <Loader2 className='size-4 animate-spin text-muted-foreground' />}
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
            {status ? `Không có khóa học ở trạng thái "${CourseStatusLabels[status]}"` : 'Bạn chưa có khóa học nào'}
          </p>
          {!status && (
            <Button asChild>
              <Link href='/instructor/courses/new'>Tạo khóa học đầu tiên</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* opacity khi đang tải trang mới: cho người dùng biết bảng sắp đổi */}
          <div className={cn('overflow-x-auto rounded-xl border transition-opacity', isFetching && 'opacity-60')}>
            <table className='w-full text-sm'>
              <thead className='bg-muted/40 text-left text-muted-foreground'>
                <tr>
                  <th className='px-4 py-3 font-medium'>Khóa học</th>
                  <th className='px-4 py-3 font-medium'>Trạng thái</th>
                  <th className='px-4 py-3 text-right font-medium'>Giá</th>
                  <th className='px-4 py-3 font-medium'>Cập nhật</th>
                  <th className='px-4 py-3 text-right font-medium'>
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
              // useSearchParams trả URLSearchParams → đổi sang object thường như PaginationLinks cần
              searchParams={Object.fromEntries(searchParams.entries())}
            />
          </div>
        </>
      )}
    </div>
  )
}

function CourseRow({ course }: { course: InstructorCourseType }) {
  return (
    <tr className='border-t align-top'>
      <td className='px-4 py-3'>
        <div className='flex gap-3'>
          <div className='relative aspect-video w-24 shrink-0 overflow-hidden rounded-md bg-muted'>
            {course.thumbnail ? (
              <Image src={course.thumbnail} alt={course.title} fill sizes='96px' className='object-cover' />
            ) : (
              <div className='flex size-full items-center justify-center text-muted-foreground'>
                <ImageOff className='size-4' />
              </div>
            )}
          </div>
          <div className='flex min-w-0 flex-col gap-1'>
            <Link href={`${PATHNAME}/${course.id}`} className='line-clamp-2 font-medium hover:text-primary'>
              {course.title}
            </Link>
            <span className='text-xs text-muted-foreground'>{course.category.name}</span>
            {/* Bị từ chối: hiện lý do để giảng viên sửa rồi gửi lại */}
            {course.status === CourseStatus.REJECTED && course.rejectReason && (
              <p className='flex items-start gap-1 text-xs text-destructive'>
                <AlertCircle className='mt-0.5 size-3.5 shrink-0' />
                <span>Lý do từ chối: {course.rejectReason}</span>
              </p>
            )}
          </div>
        </div>
      </td>
      <td className='px-4 py-3'>
        <CourseStatusBadge status={course.status} />
      </td>
      <td className='px-4 py-3 text-right tabular-nums'>{formatPrice(course.price)}</td>
      <td className='px-4 py-3 text-muted-foreground'>{formatDate(course.updatedAt)}</td>
      <td className='px-4 py-3 text-right'>
        <div className='flex justify-end gap-2'>
          {/* Soạn: chương + bài giảng · Sửa: thông tin khóa (tên, giá, ảnh bìa...) */}
          <Button asChild variant='outline' size='sm'>
            <Link href={`${PATHNAME}/${course.id}`}>
              <ListTree />
              Soạn
            </Link>
          </Button>
          <Button asChild variant='ghost' size='sm'>
            <Link href={`${PATHNAME}/${course.id}/edit`}>
              <Pencil />
              Sửa
            </Link>
          </Button>
        </div>
      </td>
    </tr>
  )
}
