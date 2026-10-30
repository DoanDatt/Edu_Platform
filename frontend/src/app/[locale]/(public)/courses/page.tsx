import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import courseApiRequest from '@/apiRequests/course'
import BreadcrumbBar from '@/components/breadcrumb-bar'
import { Skeleton } from '@/components/ui/skeleton'
import CourseList from './course-list'
import { CourseRowSkeleton } from './course-row'
import CourseSidebar from './course-sidebar'
import CourseToolbar from './course-toolbar'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Courses')
  return { title: t('metaTitle'), description: t('metaDescription') }
}

// Cột lọc: lấy lựa chọn + số khóa từ backend. Lỗi API → ẩn cột lọc, danh sách vẫn hiện
async function Filters({ mobile = false }: { mobile?: boolean }) {
  const filters = await courseApiRequest
    .filters()
    .then((res) => res.payload.data)
    .catch(() => null)
  if (!filters) return null
  if (!mobile) return <CourseSidebar filters={filters} />

  // Điện thoại / máy tính bảng: cột lọc gập lại trong <details> (mở / đóng không cần JS) ngay trên danh sách
  const t = await getTranslations('Courses')
  return (
    <details className='group rounded-[20px] border px-5 lg:hidden'>
      <summary className='cursor-pointer list-none py-4 font-heading text-lg font-semibold [&::-webkit-details-marker]:hidden'>
        {t('filters')}
      </summary>
      <div className='pb-5'>
        <CourseSidebar filters={filters} />
      </div>
    </details>
  )
}

// Trang danh sách theo Figma EduPress (Course Listing): dải đường dẫn xám, rồi 2 cột:
//   trái (~990px): "All Courses" + tìm kiếm + nút lưới / danh sách, danh sách khóa học, phân trang
//   phải (270px): cột lọc checkbox (danh mục, giảng viên, giá, đánh giá, trình độ)
// Mọi bộ lọc nằm trên URL → Server Component CourseList đọc searchParams để gọi API
async function CoursesPage({ searchParams }: PageProps<'/[locale]/courses'>) {
  const t = await getTranslations('Courses')
  return (
    <div className='flex flex-col gap-10 lg:gap-[60px]'>
      <BreadcrumbBar items={[{ label: t('title') }]} />

      <div className='grid gap-10 lg:grid-cols-[minmax(0,1fr)_270px] lg:gap-[30px]'>
        <div className='flex min-w-0 flex-col gap-[30px]'>
          {/* Toolbar + cột lọc dùng useSearchParams → bọc Suspense */}
          <Suspense fallback={<Skeleton className='h-10 w-full' />}>
            <CourseToolbar />
          </Suspense>
          <Suspense>
            <Filters mobile />
          </Suspense>
          <Suspense
            fallback={
              <div className='flex flex-col gap-[30px]' aria-label={t('loading')}>
                {Array.from({ length: 3 }, (_, index) => (
                  <CourseRowSkeleton key={index} />
                ))}
              </div>
            }
          >
            <CourseList searchParams={searchParams} />
          </Suspense>
        </div>

        <aside className='hidden lg:block'>
          <Suspense fallback={<Skeleton className='h-[600px] w-full rounded-[20px]' />}>
            <Filters />
          </Suspense>
        </aside>
      </div>
    </div>
  )
}

export default CoursesPage
