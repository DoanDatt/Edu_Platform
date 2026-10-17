import courseApiRequest from '@/apiRequests/course'
import { GetCoursesQueryType } from '@/schemaValidations/course.schema'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import CourseCard from './courses/course-card'

// Một khối danh sách khóa học trên trang chủ: tiêu đề + "Xem tất cả" + lưới CourseCard.
// Dùng lại cho nhiều khối, chỉ khác query (nổi bật, miễn phí, mới nhất...).
// Async Server Component gọi API → ở page.tsx phải bọc <Suspense>
export default async function CourseSection({
  title,
  description,
  query,
  href
}: {
  title: string
  description?: string
  query: Partial<GetCoursesQueryType>
  href: string // link "Xem tất cả": trang /courses với đúng bộ lọc đó
}) {
  // Lỗi API thì coi như không có khóa nào: trang chủ KHÔNG được sập vì 1 khối
  const courses = await courseApiRequest
    .list(query)
    .then((res) => res.payload.data)
    .catch(() => [])

  // Không có khóa nào → ẩn cả khối, không để lại tiêu đề trơ trọi
  if (courses.length === 0) return null

  return (
    <section className='flex flex-col gap-6'>
      <div className='flex items-end justify-between gap-4'>
        <div className='flex flex-col gap-1'>
          <h2 className='text-2xl font-bold tracking-tight'>{title}</h2>
          {description && <p className='text-muted-foreground'>{description}</p>}
        </div>
        <Link
          href={href}
          className='flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline'
        >
          Xem tất cả <ArrowRight className='size-4' />
        </Link>
      </div>
      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  )
}
