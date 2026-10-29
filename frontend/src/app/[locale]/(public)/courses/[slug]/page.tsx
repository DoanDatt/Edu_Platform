import courseApiRequest from '@/apiRequests/course'
import reviewApiRequest from '@/apiRequests/review'
import CourseCover from '@/components/course-cover'
import RatingStars from '@/components/rating-stars'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import Waves from '@/components/waves'
import { getCategoryStyle } from '@/constants/category'
import { formatDate, formatDuration, formatPrice, generateSlugUrl, getIdFromSlugUrl } from '@/lib/format'
import { HttpError } from '@/lib/http'
import { cn } from '@/lib/utils'
import { BarChart3, Clock, Globe, House, Infinity as InfinityIcon, PlayCircle, Users } from 'lucide-react'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { getLocale, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { cache, Suspense } from 'react'
import CourseReviews from './course-reviews'
import EnrollButton from './enroll-button'
import MyReview from './my-review'
import Curriculum from './curriculum'
import { Link, redirect } from '@/i18n/navigation'

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
export async function generateMetadata({ params }: PageProps<'/[locale]/courses/[slug]'>): Promise<Metadata> {
  const id = getIdFromSlugUrl((await params).slug)
  const t = await getTranslations('CourseDetail')
  const notFoundMetadata: Metadata = { title: t('notFound') }
  if (!Number.isInteger(id) || id <= 0) return notFoundMetadata

  try {
    const course = (await getCourse(id)).payload.data
    // Không có subtitle → tự viết 1 câu mô tả để Google vẫn có đoạn mô tả
    const description =
      course.subtitle || t('metaDescription', { title: course.title, instructor: course.instructor.name })
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

// Tiêu đề các phần (Giới thiệu, Nội dung, Đánh giá): vạch xanh nhỏ phía trước (vẽ bằng ::before)
const sectionTitle =
  'flex items-center gap-2.5 text-xl font-bold before:h-5 before:w-1.5 before:rounded-full before:bg-primary'

export default function CourseDetailPage({ params }: PageProps<`/[locale]/courses/[slug]`>) {
  return (
    <Suspense fallback={<CourseDetailSkeleton />}>
      <CourseDetail params={params} />
    </Suspense>
  )
}

async function CourseDetail({ params }: { params: PageProps<'/[locale]/courses/[slug]'>['params'] }) {
  // params cũng là Promise phải await

  const { slug } = await params
  const [t, tCourses, locale] = await Promise.all([
    getTranslations('CourseDetail'),
    getTranslations('Courses'),
    getLocale()
  ])
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
        {t('loadError')}
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
  if (slug !== canonicalSlug) redirect({ href: `/courses/${canonicalSlug}`, locale })

  // Icon danh mục (cùng icon với ô danh mục ở trang chủ và ảnh bìa)
  const { Icon: CategoryIcon } = getCategoryStyle(course.category)

  return (
    // Máy tính: 2 cột (nội dung bên trái, khung giá 360px bên phải, dính khi cuộn).
    // Điện thoại: 1 cột theo đúng thứ tự trong code: đầu trang → khung giá → nội dung
    <div className='grid gap-x-10 gap-y-8 lg:grid-cols-[1fr_360px]'>
      {/* ===== ① Đầu trang: dải xanh có sóng (cùng phong cách banner trang chủ), chữ trắng ===== */}
      <section className='relative flex min-w-0 flex-col gap-4 overflow-hidden rounded-3xl bg-linear-to-br from-sky-400 via-sky-500 to-blue-600 px-6 pt-7 pb-16 text-white md:px-10 dark:from-sky-600 dark:via-sky-700 dark:to-blue-800'>
        <div aria-hidden className='absolute -top-20 -right-16 size-72 rounded-full bg-white/20 blur-3xl' />
        <Waves className='h-1/4' />

        {/* Đường dẫn: bấm danh mục → /courses đã lọc sẵn danh mục đó (bộ lọc nằm trên URL) */}
        <nav className='relative flex flex-wrap items-center gap-2 text-sm text-white/80' aria-label={t('breadcrumb')}>
          <Link href='/' className='flex items-center gap-1 hover:text-white'>
            <House className='size-3.5' />
            {t('home')}
          </Link>
          <span>/</span>
          <Link href='/courses' className='hover:text-white'>
            {t('courses')}
          </Link>
          <span>/</span>
          <Link href={`/courses?categoryId=${course.category.id}`} className='hover:text-white'>
            {course.category.name}
          </Link>
        </nav>

        {/* Nhãn danh mục + trình độ */}
        <div className='relative flex flex-wrap gap-2'>
          <span className='flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm'>
            <CategoryIcon className='size-3.5' />
            {course.category.name}
          </span>
          <span className='rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm'>
            {tCourses(`levels.${course.level}`)}
          </span>
        </div>

        <h1 className='relative text-3xl leading-tight font-bold text-balance md:text-4xl'>{course.title}</h1>
        {course.subtitle && <p className='relative max-w-3xl text-lg text-white/90'>{course.subtitle}</p>}

        <div className='relative flex flex-wrap items-center gap-x-5 gap-y-2 text-sm'>
          {course.rating.totalReviews > 0 ? (
            <span className='flex items-center gap-1.5'>
              <RatingStars value={course.rating.averageRating} emptyClassName='text-white/40' />
              <span className='font-semibold'>{course.rating.averageRating}</span>
              <span className='text-white/80'>({tCourses('reviews', { count: course.rating.totalReviews })})</span>
            </span>
          ) : (
            <span className='text-white/80'>{tCourses('noReviews')}</span>
          )}
          <span className='flex items-center gap-1.5'>
            <Users className='size-4 text-white/80' />
            <span className='font-semibold'>{course.studentCount}</span>
            <span className='text-white/80'>{t('studentsLabel', { count: course.studentCount })}</span>
          </span>
        </div>

        <div className='relative flex flex-wrap items-center gap-3 text-sm'>
          <Avatar className='size-9 ring-2 ring-white/40'>
            <AvatarImage src={course.instructor.avatar ?? undefined} alt={course.instructor.name} />
            <AvatarFallback className='text-foreground'>{course.instructor.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className='flex flex-col'>
            <span className='text-white/80'>{t('instructor')}</span>
            <span className='font-medium'>{course.instructor.name}</span>
          </div>
          <span className='ml-2 border-l border-white/30 pl-4 text-white/80'>
            {t('published', { date: formatDate(course.publishedAt, locale) })}
          </span>
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
              <span className='text-sm text-muted-foreground'>{t('price')}</span>
              {/* Có phí: màu san hô (giống giá trên thẻ khóa học). Miễn phí: xanh thương hiệu */}
              <span className={cn('text-3xl font-bold', course.price > 0 ? 'text-highlight' : 'text-primary')}>
                {formatPrice(course.price, locale)}
              </span>
            </div>

            {/* Client Component: trang vẫn là Server Component, chỉ riêng nút này chạy ở trình duyệt */}
            <EnrollButton courseId={course.id} isEnrolled={course.isEnrolled} price={course.price} />

            <ul className='flex w-full flex-col gap-3 border-t pt-4 text-sm'>
              <li className='flex items-center gap-3'>
                <BarChart3 className='size-4 shrink-0 text-primary' />
                <span>
                  {t.rich('levelInfo', {
                    level: tCourses(`levels.${course.level}`),
                    b: (chunks) => <span className='font-semibold'>{chunks}</span>
                  })}
                </span>
              </li>
              <li className='flex items-center gap-3'>
                <PlayCircle className='size-4 shrink-0 text-primary' />
                <span>
                  {t.rich('lecturesInfo', {
                    count: course.totalLectures,
                    b: (chunks) => <span className='font-semibold'>{chunks}</span>
                  })}
                </span>
              </li>
              <li className='flex items-center gap-3'>
                <Clock className='size-4 shrink-0 text-primary' />
                <span>
                  {t.rich('durationInfo', {
                    duration: formatDuration(course.totalDurationSec, locale),
                    b: (chunks) => <span className='font-semibold'>{chunks}</span>
                  })}
                </span>
              </li>
              <li className='flex items-center gap-3'>
                <Globe className='size-4 shrink-0 text-primary' />
                {course.language === 'vi' ? t('vietnamese') : course.language}
              </li>
              <li className='flex items-center gap-3'>
                <InfinityIcon className='size-4 shrink-0 text-primary' />
                {t('anytime')}
              </li>
            </ul>
          </div>
        </div>
      </aside>

      <div className='flex min-w-0 flex-col gap-10'>
        {/* ===== ③ Giới thiệu =====
            whitespace-pre-line: giữ xuống dòng (\n) trong mô tả, không thì cả đoạn dính thành 1 dòng */}
        <section className='flex flex-col gap-3'>
          <h2 className={sectionTitle}>{t('about')}</h2>
          <p className='whitespace-pre-line leading-relaxed text-muted-foreground'>{course.description}</p>
        </section>

        {/* ===== ④ Mục lục ===== */}
        <section className='flex flex-col gap-3'>
          <h2 className={sectionTitle}>{t('content')}</h2>
          <Curriculum
            sections={course.sections}
            totalLectures={course.totalLectures}
            totalDurationSec={course.totalDurationSec}
          />
        </section>

        {/* ===== ⑤ Đánh giá ===== */}
        <section className='flex flex-col gap-3'>
          <div className='flex items-center gap-2'>
            <h2 className={sectionTitle}>{t('reviews')}</h2>
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
      <Skeleton className='h-72 rounded-3xl' />
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
