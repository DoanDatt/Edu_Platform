import courseApiRequest from '@/apiRequests/course'
import FullBleed from '@/components/full-bleed'
import SectionHeading from '@/components/section-heading'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { GetCoursesQueryType } from '@/schemaValidations/course.schema'
import { ArrowRight } from 'lucide-react'
import CourseCard, { CourseCardSkeleton } from './courses/course-card'
import { Link } from '@/i18n/navigation'

// Một khối khóa học trên trang chủ: tiêu đề canh giữa + lưới CourseCard + nút "Xem tất cả" ở cuối.
// Dùng lại cho nhiều khối, chỉ khác query (nổi bật, miễn phí...).
// tinted: nền xanh nhạt TRÀN NGANG (xen kẽ khối nền trắng → trang có nhịp khi cuộn)
// Async Server Component gọi API → ở page.tsx phải bọc <Suspense>
export default async function CourseSection({
  eyebrow,
  title,
  description,
  query,
  href,
  tinted = false
}: {
  eyebrow: string // nhãn nhỏ màu san hô trên tiêu đề
  title: string
  description?: string
  query: Partial<GetCoursesQueryType>
  href: string // link "Xem tất cả": trang /courses với đúng bộ lọc của khối này
  tinted?: boolean
}) {
  // Lỗi API → coi như không có khóa nào: trang chủ KHÔNG được sập chỉ vì 1 khối
  const courses = await courseApiRequest
    .list(query)
    .then((res) => res.payload.data)
    .catch(() => [])

  // Không có khóa nào → ẩn cả khối, không để lại tiêu đề trơ trọi
  if (courses.length === 0) return null

  const content = (
    <>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} />
      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
      <Button
        asChild
        size='lg'
        className='mx-auto h-12 rounded-full bg-linear-to-r from-sky-500 to-blue-600 px-7 text-base shadow-lg shadow-sky-500/25 hover:opacity-95'
      >
        <Link href={href}>
          Xem tất cả khóa học <ArrowRight />
        </Link>
      </Button>
    </>
  )

  return tinted ? (
    <FullBleed className='bg-accent/60 py-16 md:py-20' innerClassName='flex flex-col gap-10'>
      {content}
    </FullBleed>
  ) : (
    <section className='flex flex-col gap-10'>{content}</section>
  )
}

// Fallback của Suspense: count = số thẻ giả (khối 8 khóa thì 8, khối 4 khóa thì 4)
export function CourseSectionSkeleton({ count }: { count: number }) {
  return (
    <div className='flex flex-col gap-10'>
      <Skeleton className='mx-auto h-24 w-full max-w-md' />
      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {Array.from({ length: count }, (_, index) => (
          <CourseCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}
