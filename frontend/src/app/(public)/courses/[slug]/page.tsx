import courseApiRequest from '@/apiRequests/course'
import reviewApiRequest from '@/apiRequests/review'
import RatingStars from '@/components/rating-stars'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CourseLevelLabels } from '@/constants/type'
import { formatDate, formatDuration, formatPrice, getIdFromSlugUrl } from '@/lib/format'
import { HttpError } from '@/lib/http'
import { BarChart3, Clock, Globe, ImageOff, PlayCircle, Users } from 'lucide-react'
import { cookies } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import CourseReviews from './course-reviews'
import Curriculum from './curriculum'

export default function CourseDetailPage({ params }: PageProps<`/courses/[slug]`>) {
  return (
    <Suspense fallback={<CourseDetailSkeleton />}>
      <CourseDetail params={params} />
    </Suspense>
  )
}

async function CourseDetail({ params }: { params: Promise<{ slug: string }> }) {
  // params cũng là Promise phải await

  const { slug } = await params
  // 2. 'react-tu-co-ban-den-nang-cao-i.15' → 15
  const id = getIdFromSlugUrl(slug)
  // 3. Slug bậy (/courses/abc → NaN) → hiện trang 404 của Next, KHÔNG gọi API
  if (!Number.isInteger(id) || id <= 0) notFound()
  // 4. Server không có localStorage → tự đọc token trong cookie (route handler login đã lưu vào đây)
  const accessToken = (await cookies()).get('accessToken')?.value

  // 5. Gọi 2 API CÙNG LÚC (không cái nào phải chờ cái nào) → nhanh gần gấp đôi gọi lần lượt.
  //    allSettled (không phải all): chờ CẢ HAI xong, cho biết từng cái thành công hay thất bại
  //    → đánh giá lỗi thì trang vẫn hiện, chỉ thiếu phần đánh giá
  const [courseResult, reviewResult] = await Promise.allSettled([
    courseApiRequest.getDetail(id, accessToken),
    reviewApiRequest.list({ courseId: id, limit: 5 })
  ])

  // 6. API khóa học lỗi
  if (courseResult.status === 'rejected') {
    // 404: khóa không tồn tại / chưa xuất bản → trang 404
    // instanceof: kiểm tra đúng là HttpError (có .status) chứ không phải lỗi khác như mất mạng
    if (courseResult.reason instanceof HttpError && courseResult.reason.status === 404) notFound()
    // Lỗi khác (backend sập, 500...) → báo lỗi, header / footer vẫn còn
    return (
      <p className='rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive'>
        Không tải được khóa học. Vui lòng thử lại sau.
      </p>
    )
  }

  // Tới đây chắc chắn courseResult.status === 'fulfilled' → TypeScript cho đọc .value
  const course = courseResult.value.payload.data
  // Đánh giá lỗi → mảng rỗng, trang vẫn hiện
  const reviews = reviewResult.status === 'fulfilled' ? reviewResult.value.payload.data : []

  return (
    <div className='flex flex-col gap-8'>
      {/* ===== ① Đầu trang ===== */}
      <section className='flex flex-col gap-4 rounded-2xl bg-muted/50 p-6 md:p-8'>
        {/* Đường dẫn: bấm danh mục → /courses đã lọc sẵn danh mục đó (bộ lọc nằm trên URL) */}
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
          {course.rating.totalReviews > 0 ? (
            <span className='flex items-center gap-1.5'>
              <span className='font-semibold text-amber-600 dark:text-amber-400'>{course.rating.averageRating}</span>
              <RatingStars value={course.rating.averageRating} />
              <span className='text-muted-foreground'>({course.rating.totalReviews} đánh giá)</span>
            </span>
          ) : (
            <span className='text-muted-foreground'>Chưa có đánh giá</span>
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

      {/* Máy tính: 3 cột (nội dung 2 cột + khung bên phải 1 cột). Điện thoại: 1 cột */}
      <div className='grid gap-8 lg:grid-cols-3'>
        {/* ===== ② Khung bên phải =====
            lg:order-last: trên máy tính đứng bên PHẢI; trên điện thoại vẫn đứng TRƯỚC nội dung (thấy giá + nút ngay)
            lg:sticky lg:top-24: cuộn trang thì khung này dính lại, nút ghi danh luôn trong tầm mắt */}
        <aside className='lg:sticky lg:top-24 lg:order-last lg:self-start'>
          <div className='overflow-hidden rounded-xl border bg-card shadow-sm'>
            <div className='relative aspect-video bg-muted'>
              {course.thumbnail ? (
                <Image
                  src={course.thumbnail}
                  alt={course.title}
                  fill
                  priority // ảnh chính của trang, tải ngay không chờ cuộn tới
                  sizes='(min-width: 1024px) 33vw, 100vw'
                  className='object-cover'
                />
              ) : (
                <div className='flex size-full items-center justify-center text-muted-foreground'>
                  <ImageOff className='size-8' />
                </div>
              )}
            </div>

            <div className='flex flex-col gap-4 p-5'>
              <span className='text-3xl font-bold'>{formatPrice(course.price)}</span>

              {/* TODO vòng 6: thay bằng nút ghi danh thật (useMutation). Tạm thời chỉ hiện đúng chữ theo isEnrolled */}
              <Button size='lg' className='w-full' disabled>
                {course.isEnrolled === null ? 'Đăng nhập để ghi danh' : course.isEnrolled ? 'Vào học' : 'Ghi danh'}
              </Button>

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

        <div className='flex flex-col gap-10 lg:col-span-2'>
          {/* ===== ③ Giới thiệu =====
              whitespace-pre-line: giữ xuống dòng (\n) trong mô tả, không thì cả đoạn dính thành 1 dòng */}
          <section className='flex flex-col gap-3'>
            <h2 className='text-xl font-semibold'>Giới thiệu khóa học</h2>
            <p className='whitespace-pre-line leading-relaxed text-muted-foreground'>{course.description}</p>
          </section>

          {/* ===== ④ Mục lục ===== */}
          <section className='flex flex-col gap-3'>
            <h2 className='text-xl font-semibold'>Nội dung khóa học</h2>
            <Curriculum
              sections={course.sections}
              totalLectures={course.totalLectures}
              totalDurationSec={course.totalDurationSec}
            />
          </section>

          {/* ===== ⑤ Đánh giá ===== */}
          <section className='flex flex-col gap-3'>
            <div className='flex items-center gap-2'>
              <h2 className='text-xl font-semibold'>Đánh giá của học viên</h2>
              {course.rating.totalReviews > 0 && <Badge variant='secondary'>{course.rating.totalReviews}</Badge>}
            </div>
            <CourseReviews rating={course.rating} reviews={reviews} />
          </section>
        </div>
      </div>
    </div>
  )
}

// Khung xám giả trong lúc chờ API (fallback của Suspense), hình dạng giống trang thật
function CourseDetailSkeleton() {
  return (
    <div className='flex flex-col gap-8'>
      <div className='flex flex-col gap-4 rounded-2xl bg-muted/50 p-6 md:p-8'>
        <Skeleton className='h-4 w-40' />
        <Skeleton className='h-10 w-3/4' />
        <Skeleton className='h-6 w-1/2' />
        <Skeleton className='h-4 w-2/3' />
      </div>
      <div className='grid gap-8 lg:grid-cols-3'>
        <Skeleton className='h-96 rounded-xl lg:order-last' />
        <div className='flex flex-col gap-4 lg:col-span-2'>
          <Skeleton className='h-6 w-48' />
          <Skeleton className='h-24 w-full' />
          <Skeleton className='h-6 w-48' />
          <Skeleton className='h-48 w-full' />
        </div>
      </div>
    </div>
  )
}
