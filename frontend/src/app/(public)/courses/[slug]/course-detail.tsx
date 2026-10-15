import courseApiRequest from '@/apiRequests/course'
import reviewApiRequest from '@/apiRequests/review'
import CourseThumbnail from '@/components/course-thumbnail'
import RatingStars from '@/components/rating-stars'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CourseLevelLabels } from '@/constants/type'
import { formatDate, formatDuration, formatPrice, generateSlugUrl, getIdFromSlugUrl } from '@/lib/format'
import { HttpError } from '@/lib/http'
import { BarChart3, Clock, Globe, PlayCircle, Users } from 'lucide-react'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import Curriculum from './curriculum'
import CourseReviews from './course-reviews'
import EnrollButton from './enroll-button'

// Server Component, async. Nằm trong <Suspense> ở page.tsx vì đọc params, cookies() và gọi API
export default async function CourseDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const id = getIdFromSlugUrl(slug)
  if (!Number.isInteger(id) || id <= 0) notFound()

  // Ở server không có localStorage → tự đọc access token trong cookie rồi truyền vào,
  // để backend biết isEnrolled. Không có / hết hạn → backend coi như khách (isEnrolled: null)
  const accessToken = (await cookies()).get('accessToken')?.value

  // Gọi 2 API CÙNG LÚC (không đợi cái này xong mới gọi cái kia)
  const [courseResult, reviewResult] = await Promise.allSettled([
    courseApiRequest.getDetail(id, accessToken),
    reviewApiRequest.list({ courseId: id, limit: 5 })
  ])

  if (courseResult.status === 'rejected') {
    // Khóa không tồn tại / chưa xuất bản → trang 404
    if (courseResult.reason instanceof HttpError && courseResult.reason.status === 404) notFound()
    return (
      <p className='rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive'>
        Không tải được khóa học. Vui lòng thử lại sau.
      </p>
    )
  }
  const course = courseResult.value.payload.data
  // Đánh giá lỗi thì trang vẫn hiện, chỉ thiếu danh sách đánh giá
  const reviews = reviewResult.status === 'fulfilled' ? reviewResult.value.payload.data : []

  // Slug sai chữ nhưng đúng id (ví dụ khóa đổi tên): chuyển về URL chuẩn, tốt cho SEO
  const canonicalSlug = generateSlugUrl({ name: course.title, id: course.id })
  if (slug !== canonicalSlug) redirect(`/courses/${canonicalSlug}`)

  return (
    <div className='flex flex-col gap-8'>
      {/* ===== Phần đầu trang ===== */}
      <section className='flex flex-col gap-4 rounded-2xl bg-muted/50 p-6 md:p-8'>
        <nav className='text-sm text-muted-foreground' aria-label='Đường dẫn'>
          <Link href='/courses' className='hover:text-foreground'>
            Khóa học
          </Link>
          <span className='mx-2'>/</span>
          <Link href={`/courses?categoryId=${course.category.id}`} className='hover:text-foreground'>
            {course.category.name}
          </Link>
        </nav>
        <h1 className='text-3xl font-bold tracking-tight md:text-4xl'>{course.title}</h1>
        {course.subtitle && <p className='max-w-3xl text-lg text-muted-foreground'>{course.subtitle}</p>}

        <div className='flex flex-wrap items-center gap-x-5 gap-y-2 text-sm'>
          {course.rating.totalReviews > 0 && (
            <span className='flex items-center gap-1.5'>
              <span className='font-semibold text-amber-600 dark:text-amber-400'>{course.rating.averageRating}</span>
              <RatingStars value={course.rating.averageRating} />
              <span className='text-muted-foreground'>({course.rating.totalReviews} đánh giá)</span>
            </span>
          )}
          <span className='flex items-center gap-1.5 text-muted-foreground'>
            <Users className='size-4' />
            {course.studentCount} học viên
          </span>
          <span className='text-muted-foreground'>
            Giảng viên: <span className='font-medium text-foreground'>{course.instructor.name}</span>
          </span>
          <span className='text-muted-foreground'>Xuất bản {formatDate(course.publishedAt)}</span>
        </div>
      </section>

      <div className='grid gap-8 lg:grid-cols-3'>
        {/* ===== Khung mua / ghi danh. Màn hình lớn: cột phải, dính khi cuộn. Màn hình nhỏ: lên trước ===== */}
        <aside className='lg:sticky lg:top-24 lg:order-last lg:self-start'>
          <div className='overflow-hidden rounded-xl border bg-card shadow-sm'>
            <CourseThumbnail src={course.thumbnail} alt={course.title} priority sizes='(min-width: 1024px) 33vw, 100vw' />
            <div className='flex flex-col gap-4 p-5'>
              <span className='text-3xl font-bold'>{formatPrice(course.price)}</span>
              <EnrollButton courseId={course.id} isEnrolled={course.isEnrolled} price={course.price} />
              <ul className='flex flex-col gap-2.5 text-sm text-muted-foreground'>
                <li className='flex items-center gap-2'>
                  <PlayCircle className='size-4' />
                  {course.totalLectures} bài giảng
                </li>
                <li className='flex items-center gap-2'>
                  <Clock className='size-4' />
                  {formatDuration(course.totalDurationSec)} video
                </li>
                <li className='flex items-center gap-2'>
                  <BarChart3 className='size-4' />
                  {CourseLevelLabels[course.level]}
                </li>
                <li className='flex items-center gap-2'>
                  <Globe className='size-4' />
                  {course.language === 'vi' ? 'Tiếng Việt' : course.language}
                </li>
              </ul>
            </div>
          </div>
        </aside>

        {/* ===== Nội dung chính ===== */}
        <div className='flex flex-col gap-10 lg:col-span-2'>
          {course.description && (
            <section className='flex flex-col gap-3'>
              <h2 className='text-xl font-semibold'>Giới thiệu khóa học</h2>
              {/* whitespace-pre-line: giữ xuống dòng giảng viên đã gõ trong mô tả */}
              <p className='whitespace-pre-line leading-relaxed text-muted-foreground'>{course.description}</p>
            </section>
          )}

          <section className='flex flex-col gap-3'>
            <h2 className='text-xl font-semibold'>Nội dung khóa học</h2>
            <Curriculum
              sections={course.sections}
              totalLectures={course.totalLectures}
              totalDurationSec={course.totalDurationSec}
            />
          </section>

          <section className='flex flex-col gap-3'>
            <div className='flex items-center gap-2'>
              <h2 className='text-xl font-semibold'>Đánh giá của học viên</h2>
              <Badge variant='secondary'>{course.rating.totalReviews}</Badge>
            </div>
            <CourseReviews rating={course.rating} reviews={reviews} />
          </section>
        </div>
      </div>
    </div>
  )
}

export function CourseDetailSkeleton() {
  return (
    <div className='flex flex-col gap-8'>
      <Skeleton className='h-48 w-full rounded-2xl' />
      <div className='grid gap-8 lg:grid-cols-3'>
        <div className='flex flex-col gap-4 lg:col-span-2'>
          <Skeleton className='h-6 w-48' />
          <Skeleton className='h-24 w-full' />
          <Skeleton className='h-64 w-full' />
        </div>
        <Skeleton className='h-96 w-full rounded-xl' />
      </div>
    </div>
  )
}
