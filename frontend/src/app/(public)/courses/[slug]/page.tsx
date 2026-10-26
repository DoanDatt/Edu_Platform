import courseApiRequest from '@/apiRequests/course'
import reviewApiRequest from '@/apiRequests/review'
import CourseCover from '@/components/course-cover'
import RatingStars from '@/components/rating-stars'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CourseLevelLabels } from '@/constants/type'
import { formatDate, formatDuration, formatPrice, generateSlugUrl, getIdFromSlugUrl } from '@/lib/format'
import { HttpError } from '@/lib/http'
import { BarChart3, Clock, Globe, House, Infinity as InfinityIcon, PlayCircle, Users } from 'lucide-react'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { cache, Suspense } from 'react'
import CourseReviews from './course-reviews'
import EnrollButton from './enroll-button'
import MyReview from './my-review'
import Curriculum from './curriculum'

// Lấy 1 khóa học, dùng chung cho generateMetadata VÀ CourseDetail.
// cache() của React: trong CÙNG 1 lần render trang, gọi bao nhiêu lần với cùng id
// thì cũng chỉ gọi API 1 lần, các lần sau dùng lại kết quả (kể cả khi lỗi)
// Đọc token ngay trong hàm (không truyền vào) để 2 nơi gọi có CÙNG tham số → cache mới trùng được
const getCourse = cache(async (id: number) => {
  const accessToken = (await cookies()).get('accessToken')?.value
  return courseApiRequest.getDetail(id, accessToken)
})

// Tiêu đề tab, mô tả, ảnh khi dán link lên Facebook / Zalo (Open Graph).
// Tiêu đề phụ thuộc dữ liệu → dùng HÀM generateMetadata thay vì object metadata cố định như /courses.
// title 'React...' + template '%s | EduPlatform' ở layout gốc → tab hiện 'React... | EduPlatform'
export async function generateMetadata({ params }: PageProps<'/courses/[slug]'>): Promise<Metadata> {
  const id = getIdFromSlugUrl((await params).slug)
  const notFoundMetadata: Metadata = { title: 'Không tìm thấy khóa học' }
  if (!Number.isInteger(id) || id <= 0) return notFoundMetadata

  try {
    const course = (await getCourse(id)).payload.data
    // Không có subtitle → tự viết 1 câu mô tả để Google vẫn có đoạn mô tả
    const description = course.subtitle || `Khóa học ${course.title} của ${course.instructor.name} trên EduPlatform`
    return {
      title: course.title,
      description,
      openGraph: {
        title: course.title,
        description,
        images: course.thumbnail ? [course.thumbnail] : undefined
      }
    }
  } catch {
    return notFoundMetadata
  }
}

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

  // 4. Gọi 2 API CÙNG LÚC (không cái nào phải chờ cái nào) → nhanh gần gấp đôi gọi lần lượt.
  //    allSettled (không phải all): chờ CẢ HAI xong, cho biết từng cái thành công hay thất bại
  //    → đánh giá lỗi thì trang vẫn hiện, chỉ thiếu phần đánh giá
  //    getCourse (có cache): generateMetadata đã gọi rồi thì ở đây dùng lại, không gọi API lần 2.
  //    Token đọc từ cookie nằm bên trong getCourse (server không có localStorage)
  const [courseResult, reviewResult] = await Promise.allSettled([
    getCourse(id),
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

  // 5. Slug sai chữ nhưng đúng id (gõ tay, link cũ trước khi khóa đổi tên...) → chuyển về URL chuẩn.
  //    Mỗi khóa chỉ có ĐÚNG 1 URL → Google không coi là nội dung trùng lặp
  const canonicalSlug = generateSlugUrl({ name: course.title, id: course.id })
  if (slug !== canonicalSlug) redirect(`/courses/${canonicalSlug}`)

  return (
    // Máy tính: 2 cột (nội dung bên trái, khung giá 360px bên phải, dính khi cuộn).
    // Điện thoại: 1 cột theo đúng thứ tự trong code: đầu trang → khung giá → nội dung
    <div className='grid gap-x-10 gap-y-8 lg:grid-cols-[1fr_360px]'>
      {/* ===== ① Đầu trang ===== */}
      <section className='flex min-w-0 flex-col gap-4'>
        {/* Đường dẫn: bấm danh mục → /courses đã lọc sẵn danh mục đó (bộ lọc nằm trên URL) */}
        <nav className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground' aria-label='Đường dẫn'>
          <Link href='/' className='flex items-center gap-1 hover:text-foreground'>
            <House className='size-3.5 text-primary' />
            Trang chủ
          </Link>
          <span>/</span>
          <Link href='/courses' className='hover:text-foreground'>
            Khóa học
          </Link>
          <span>/</span>
          <Link href={`/courses?categoryId=${course.category.id}`} className='hover:text-foreground'>
            {course.category.name}
          </Link>
        </nav>

        <h1 className='text-3xl font-bold tracking-tight md:text-4xl'>{course.title}</h1>
        {course.subtitle && <p className='max-w-3xl text-lg text-muted-foreground'>{course.subtitle}</p>}

        <div className='flex flex-wrap items-center gap-x-5 gap-y-2 text-sm'>
          {course.rating.totalReviews > 0 ? (
            <span className='flex items-center gap-1.5'>
              <RatingStars value={course.rating.averageRating} />
              <span className='font-semibold'>{course.rating.averageRating}</span>
              <span className='text-muted-foreground'>({course.rating.totalReviews} đánh giá)</span>
            </span>
          ) : (
            <span className='text-muted-foreground'>Chưa có đánh giá</span>
          )}
          <span className='flex items-center gap-1.5'>
            <Users className='size-4 text-muted-foreground' />
            <span className='font-semibold'>{course.studentCount}</span>
            <span className='text-muted-foreground'>học viên</span>
          </span>
        </div>

        <div className='flex flex-wrap items-center gap-3 text-sm'>
          <Avatar className='size-9'>
            <AvatarImage src={course.instructor.avatar ?? undefined} alt={course.instructor.name} />
            <AvatarFallback>{course.instructor.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className='flex flex-col'>
            <span className='text-muted-foreground'>Giảng viên</span>
            <span className='font-medium'>{course.instructor.name}</span>
          </div>
          <span className='ml-2 border-l pl-4 text-muted-foreground'>Xuất bản {formatDate(course.publishedAt)}</span>
        </div>
      </section>

      {/* ===== ② Khung giá =====
          lg:col-start-2 lg:row-start-1 lg:row-span-2: trên máy tính nằm ở cột phải, cao bằng đầu trang + nội dung
          lg:sticky lg:top-24 lg:self-start: cuộn trang thì khung dính lại, nút ghi danh luôn trong tầm mắt */}
      <aside className='lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start'>
        <div className='overflow-hidden rounded-2xl border bg-card p-3 shadow-sm'>
          <CourseCover
            course={course}
            priority // ảnh chính của trang, tải ngay không chờ cuộn tới
            sizes='(min-width: 1024px) 360px, 100vw'
            className='rounded-xl'
          />

          <div className='flex flex-col items-center gap-4 px-3 pt-5 pb-3'>
            <div className='flex flex-col items-center'>
              <span className='text-sm text-muted-foreground'>Học phí</span>
              <span className='text-3xl font-bold text-primary'>{formatPrice(course.price)}</span>
            </div>

            {/* Client Component: trang vẫn là Server Component, chỉ riêng nút này chạy ở trình duyệt */}
            <EnrollButton courseId={course.id} isEnrolled={course.isEnrolled} price={course.price} />

            <ul className='flex w-full flex-col gap-3 border-t pt-4 text-sm'>
              <li className='flex items-center gap-3'>
                <BarChart3 className='size-4 shrink-0 text-primary' />
                <span>
                  Trình độ <span className='font-semibold'>{CourseLevelLabels[course.level]}</span>
                </span>
              </li>
              <li className='flex items-center gap-3'>
                <PlayCircle className='size-4 shrink-0 text-primary' />
                <span>
                  Tổng số <span className='font-semibold'>{course.totalLectures}</span> bài giảng
                </span>
              </li>
              <li className='flex items-center gap-3'>
                <Clock className='size-4 shrink-0 text-primary' />
                <span>
                  Thời lượng <span className='font-semibold'>{formatDuration(course.totalDurationSec)}</span>
                </span>
              </li>
              <li className='flex items-center gap-3'>
                <Globe className='size-4 shrink-0 text-primary' />
                {course.language === 'vi' ? 'Tiếng Việt' : course.language}
              </li>
              <li className='flex items-center gap-3'>
                <InfinityIcon className='size-4 shrink-0 text-primary' />
                Học mọi lúc, mọi nơi
              </li>
            </ul>
          </div>
        </div>
      </aside>

      <div className='flex min-w-0 flex-col gap-10'>
        {/* ===== ③ Giới thiệu =====
            whitespace-pre-line: giữ xuống dòng (\n) trong mô tả, không thì cả đoạn dính thành 1 dòng */}
        <section className='flex flex-col gap-3'>
          <h2 className='text-xl font-bold'>Giới thiệu khóa học</h2>
          <p className='whitespace-pre-line leading-relaxed text-muted-foreground'>{course.description}</p>
        </section>

        {/* ===== ④ Mục lục ===== */}
        <section className='flex flex-col gap-3'>
          <h2 className='text-xl font-bold'>Nội dung khóa học</h2>
          <Curriculum
            sections={course.sections}
            totalLectures={course.totalLectures}
            totalDurationSec={course.totalDurationSec}
          />
        </section>

        {/* ===== ⑤ Đánh giá ===== */}
        <section className='flex flex-col gap-3'>
          <div className='flex items-center gap-2'>
            <h2 className='text-xl font-bold'>Đánh giá của học viên</h2>
            {course.rating.totalReviews > 0 && <Badge variant='secondary'>{course.rating.totalReviews}</Badge>}
          </div>
          {/* Chỉ người ĐÃ GHI DANH mới viết / sửa / xóa đánh giá (backend cũng chặn: 403).
              isEnrolled: null = khách, false = chưa ghi danh */}
          {course.isEnrolled === true && <MyReview courseId={course.id} />}
          <CourseReviews rating={course.rating} reviews={reviews} />
        </section>
      </div>
    </div>
  )
}

// Khung xám giả trong lúc chờ API (fallback của Suspense), hình dạng giống trang thật
function CourseDetailSkeleton() {
  return (
    <div className='grid gap-x-10 gap-y-8 lg:grid-cols-[1fr_360px]'>
      <div className='flex flex-col gap-4'>
        <Skeleton className='h-4 w-56' />
        <Skeleton className='h-10 w-3/4' />
        <Skeleton className='h-6 w-1/2' />
        <Skeleton className='h-4 w-2/3' />
      </div>
      <Skeleton className='h-120 rounded-2xl lg:col-start-2 lg:row-span-2 lg:row-start-1' />
      <div className='flex flex-col gap-4'>
        <Skeleton className='h-6 w-48' />
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-6 w-48' />
        <Skeleton className='h-48 w-full' />
      </div>
    </div>
  )
}
