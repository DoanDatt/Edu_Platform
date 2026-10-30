import courseApiRequest from '@/apiRequests/course'
import reviewApiRequest from '@/apiRequests/review'
import CourseCover from '@/components/course-cover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDuration, formatPrice, generateSlugUrl, getIdFromSlugUrl } from '@/lib/format'
import { HttpError } from '@/lib/http'
import { cn } from '@/lib/utils'
import { BarChart3, FileText } from 'lucide-react'
import Image from 'next/image'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { getLocale, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { cache, Suspense } from 'react'
import CourseReviews from './course-reviews'
import EnrollButton from './enroll-button'
import MyReview from './my-review'
import Curriculum from './curriculum'
import CourseComments from './course-comments'
import CourseFaqs from './course-faqs'
import CourseTabs from './course-tabs'
import { redirect } from '@/i18n/navigation'
import BreadcrumbBar from '@/components/breadcrumb-bar'

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

  // Nội dung 5 tab (Server Component dựng sẵn, CourseTabs chỉ ẩn / hiện)
  const overview = (
    // whitespace-pre-line: giữ xuống dòng (\n) trong mô tả, không thì cả đoạn dính thành 1 dòng
    <div className='flex flex-col gap-4 leading-relaxed text-muted-foreground'>
      {course.subtitle && <p className='font-medium text-foreground'>{course.subtitle}</p>}
      <p className='whitespace-pre-line'>{course.description}</p>
    </div>
  )

  const instructorPanel = (
    // Tab Instructor: ảnh vuông, tên, giới thiệu, số học viên + số khóa (số THẬT).
    // Đoạn giới thiệu: tài khoản chưa có trường "bio" → tạm dùng câu MẪU, thay bằng dữ liệu thật sau
    <div className='flex flex-col gap-5'>
      <div className='flex flex-col gap-5 sm:flex-row'>
        <Avatar className='size-[150px] shrink-0 rounded-[20px] after:rounded-[20px]'>
          <AvatarImage src={course.instructor.avatar ?? undefined} alt={course.instructor.name} className='rounded-[20px]' />
          <AvatarFallback className='rounded-[20px] bg-primary font-heading text-5xl text-white'>
            {course.instructor.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className='flex flex-col gap-3'>
          <h3 className='text-xl leading-[1.2]'>{course.instructor.name}</h3>
          <p className='leading-relaxed text-muted-foreground'>{t('instructorBio', { name: course.instructor.name })}</p>
          <div className='flex flex-col gap-2 text-base'>
            <span className='flex items-center gap-2'>
              <Image src='/edupress/icons/graduation-cap.svg' alt='' width={16} height={16} className='size-4' />
              {tCourses('students', { count: course.instructor.studentCount })}
            </span>
            <span className='flex items-center gap-2'>
              <FileText className='size-4 text-primary' />
              {t('courseCount', { count: course.instructor.courseCount })}
            </span>
          </div>
        </div>
      </div>
      <p className='leading-relaxed text-muted-foreground'>{t('instructorBioMore')}</p>
    </div>
  )

  const reviewsPanel = (
    <div className='flex flex-col gap-6'>
      {/* Chỉ người ĐÃ GHI DANH mới viết / sửa / xóa đánh giá (backend cũng chặn: 403).
          isEnrolled: null = khách, false = chưa ghi danh */}
      {course.isEnrolled === true && <MyReview courseId={course.id} />}
      <CourseReviews rating={course.rating} reviews={reviews} />
    </div>
  )

  return (
    <div className='flex flex-col'>
      {/* Dải đường dẫn xám: bấm danh mục → /courses đã lọc sẵn danh mục đó (bộ lọc nằm trên URL) */}
      <BreadcrumbBar
        items={[
          { label: t('courses'), href: '/courses' },
          { label: course.category.name, href: `/courses?categoryId=${course.category.id}` },
          { label: course.title }
        ]}
      />

      {/* Máy tính: 2 cột như Figma Course Single (nội dung ~840px bên trái, thẻ ảnh + giá 410px bên phải).
          Điện thoại: 1 cột theo đúng thứ tự trong code: đầu trang → thẻ giá → tab → bình luận */}
      <div className='grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_410px]'>
        {/* ===== ① Dải ĐEN tràn ngang (Course Single của EduPress), chữ trắng =====
            Nền đen là 1 lớp riêng ở hàng 1 của lưới, kéo rộng bằng màn hình (w-screen, giống FullBleed);
            section phía sau cũng relative và đứng sau trong code → nằm đè lên lớp đen.
            col-[1/-1]: trải từ cột đầu tới cột cuối. KHÔNG dùng col-start-1 + col-span-2: cả 2 đều ghi
            grid-column, col-span-2 đè mất col-start-1 → ô bị xếp tự động sang cột thừa */}
        <div aria-hidden className='relative col-[1/-1] row-start-1'>
          <div className='absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 bg-black' />
        </div>
        <section className='relative col-start-1 row-start-1 flex min-w-0 flex-col gap-4 py-10 text-white md:py-[50px]'>
          <div className='flex flex-wrap items-center gap-3'>
            <span className='rounded-lg bg-[#555] px-3 py-2 text-base leading-normal font-medium'>
              {course.category.name}
            </span>
            <span className='text-base text-[#9d9d9d]'>
              {t.rich('byInstructorLine', {
                name: course.instructor.name,
                b: (chunks) => <span className='text-white'>{chunks}</span>
              })}
            </span>
          </div>

          <h1 className='text-[32px] leading-[1.2] text-balance md:text-[40px]'>{course.title}</h1>

          {/* Hàng thông tin như Figma (2Weeks · 156 Students · All levels · 20 Lessons), icon cam */}
          <div className='flex flex-wrap items-center gap-x-6 gap-y-2 text-base leading-normal'>
            <span className='flex items-center gap-2'>
              <Image src='/edupress/icons/clock.svg' alt='' width={16} height={16} className='size-4' />
              {formatDuration(course.totalDurationSec, locale)}
            </span>
            <span className='flex items-center gap-2'>
              <Image src='/edupress/icons/graduation-cap.svg' alt='' width={16} height={16} className='size-4' />
              {tCourses('students', { count: course.studentCount })}
            </span>
            <span className='flex items-center gap-2'>
              <BarChart3 className='size-4 text-primary' />
              {tCourses(`levels.${course.level}`)}
            </span>
            <span className='flex items-center gap-2'>
              <FileText className='size-4 text-primary' />
              {tCourses('lessons', { count: course.totalLectures })}
            </span>
          </div>
        </section>

        {/* ===== ② Thẻ ảnh + giá + nút (Figma: "$49.0  Start Now") =====
            lg:col-start-2 lg:row-start-1 lg:row-span-2: cột phải, chồng lên dải đen
            lg:sticky lg:top-24 lg:self-start: cuộn trang thì thẻ dính lại, nút ghi danh luôn trong tầm mắt */}
        <aside className='lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-[50px] lg:self-start'>
          <div className='overflow-hidden rounded-[20px] border bg-card shadow-[0_4px_10px_rgba(0,0,0,0.1)]'>
            <CourseCover
              course={course}
              priority // ảnh chính của trang, tải ngay không chờ cuộn tới
              sizes='(min-width: 1024px) 410px, 100vw'
              className='aspect-[410/250]'
            />
            <div className='flex flex-wrap items-center justify-between gap-4 p-5'>
              {/* Miễn phí: xanh lá như "Free" của EduPress. Có phí: đỏ như giá trong Figma */}
              <span
                className={cn(
                  'font-heading text-2xl leading-[1.2] font-semibold',
                  course.price === 0 ? 'text-highlight' : 'text-[#f51a1a]'
                )}
              >
                {formatPrice(course.price, locale)}
              </span>
              {/* Client Component: trang vẫn là Server Component, chỉ riêng nút này chạy ở trình duyệt */}
              <EnrollButton
                courseId={course.id}
                isEnrolled={course.isEnrolled}
                price={course.price}
                className='h-12 w-auto px-6 text-lg'
              />
            </div>
          </div>
        </aside>

        {/* ===== ③ 5 tab + bình luận ===== */}
        <div className='flex min-w-0 flex-col gap-[50px] lg:pt-2'>
          <CourseTabs
            tabs={[
              { key: 'overview', label: t('tabOverview'), content: overview },
              {
                key: 'curriculum',
                label: t('tabCurriculum'),
                content: (
                  <Curriculum
                    sections={course.sections}
                    totalLectures={course.totalLectures}
                    totalDurationSec={course.totalDurationSec}
                  />
                )
              },
              { key: 'instructor', label: t('tabInstructor'), content: instructorPanel },
              { key: 'faqs', label: t('tabFaqs'), content: <CourseFaqs /> },
              { key: 'reviews', label: t('tabReviews'), content: reviewsPanel }
            ]}
          />
          <CourseComments courseId={course.id} />
        </div>
      </div>
    </div>
  )
}


// Khung xám giả trong lúc chờ API (fallback của Suspense), hình dạng giống trang thật
function CourseDetailSkeleton() {
  return (
    <div className='grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_410px]'>
      <Skeleton className='h-72 rounded-[20px]' />
      <Skeleton className='h-120 rounded-[20px] lg:col-start-2 lg:row-span-2 lg:row-start-1' />
      <div className='flex flex-col gap-4'>
        <Skeleton className='h-6 w-48' />
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-6 w-48' />
        <Skeleton className='h-48 w-full' />
      </div>
    </div>
  )
}
