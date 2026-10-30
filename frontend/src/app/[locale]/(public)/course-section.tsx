import courseApiRequest from '@/apiRequests/course'
import TopHeading from '@/components/top-heading'
import { Skeleton } from '@/components/ui/skeleton'
import { GetCoursesQueryType } from '@/schemaValidations/course.schema'
import CourseCard, { CourseCardSkeleton } from './courses/course-card'

// "Featured Courses" theo Figma EduPress (node 1:1316): tiêu đề bên trái + nút "All Courses" bên phải,
// lưới 3 cột × 410px, cách nhau 30px. Dữ liệu thật: query truyền vào (vd khóa đông học viên nhất).
// pt-4 ở lưới: chừa chỗ cho thẻ nhô lên 16px khi rê chuột.
// Async Server Component gọi API → ở page.tsx phải bọc <Suspense>
export default async function CourseSection({
  title,
  description,
  query,
  action
}: {
  title: string
  description?: string
  query: Partial<GetCoursesQueryType>
  action: { label: string; href: string } // nút bên phải: trang /courses với đúng bộ lọc của khối này
}) {
  // Lỗi API → coi như không có khóa nào: trang chủ KHÔNG được sập chỉ vì 1 khối
  const courses = await courseApiRequest
    .list(query)
    .then((res) => res.payload.data)
    .catch(() => [])

  // Không có khóa nào → ẩn cả khối, không để lại tiêu đề trơ trọi
  if (courses.length === 0) return null

  return (
    <section className='flex flex-col gap-[34px]'>
      <TopHeading title={title} description={description} action={action} />
      <div className='grid gap-[30px] pt-4 sm:grid-cols-2 lg:grid-cols-3'>
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  )
}

// Fallback của Suspense: count = số thẻ giả
export function CourseSectionSkeleton({ count }: { count: number }) {
  return (
    <div className='flex flex-col gap-[34px]'>
      <Skeleton className='h-[77px] w-full max-w-sm' />
      <div className='grid gap-[30px] pt-4 sm:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: count }, (_, index) => (
          <CourseCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}
