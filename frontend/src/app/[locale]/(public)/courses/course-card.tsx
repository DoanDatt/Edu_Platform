import CourseCover from '@/components/course-cover'
import RatingStars from '@/components/rating-stars'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice, generateSlugUrl } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PublicCourseType } from '@/schemaValidations/course.schema'
import { ArrowRight, BookOpen, Users } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'

// Thẻ 1 khóa học. Cả thẻ là 1 link tới trang chi tiết.
// Phong cách: nền trắng, viền mảnh pha xanh, bo góc lớn. Rê chuột: nổi lên, viền + bóng đổ ngả màu xanh thương hiệu.
// Bố cục từ trên xuống: ảnh bìa (nhãn trình độ ở góc) · sao + số đánh giá · tên · số bài + số học viên ·
// mô tả ngắn · giảng viên · (vạch ngăn) giá + "Xem chi tiết"
export default function CourseCard({ course }: { course: PublicCourseType }) {
  const t = useTranslations('Courses')
  const locale = useLocale()
  // Link dạng slug: /courses/react-tu-co-ban-den-nang-cao-i.15
  const href = `/courses/${generateSlugUrl({ name: course.title, id: course.id })}`

  return (
    <Link
      href={href}
      // p-3: ảnh "lọt lòng" thẻ (có viền đệm quanh ảnh, ảnh bo góc riêng) thay vì ảnh tràn sát mép thẻ
      className='group flex flex-col rounded-3xl border bg-card p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10'
    >
      <div className='relative overflow-hidden rounded-2xl'>
        <CourseCover
          course={course}
          sizes='(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'
        />
        {/* Nhãn trình độ nổi trên góc ảnh */}
        <span className='absolute top-2.5 right-2.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur-sm'>
          {t(`levels.${course.level}`)}
        </span>
      </div>

      <div className='flex flex-1 flex-col gap-2.5 px-1.5 pt-4 pb-1'>
        {/* Đánh giá: có thì hiện sao + điểm + số lượt, chưa có thì ghi rõ (không để dòng trống) */}
        <div className='flex items-center gap-1.5 text-xs'>
          {course.rating.totalReviews > 0 ? (
            <>
              <RatingStars value={course.rating.averageRating} className='size-3.5' />
              <span className='font-semibold'>{course.rating.averageRating}</span>
              <span className='text-muted-foreground'>({t('reviews', { count: course.rating.totalReviews })})</span>
            </>
          ) : (
            <span className='text-muted-foreground'>{t('noReviews')}</span>
          )}
        </div>

        {/* line-clamp-2: tên dài quá 2 dòng thì cắt bằng "..." để các thẻ cao bằng nhau */}
        <h3 className='line-clamp-2 font-heading leading-snug font-semibold transition-colors group-hover:text-primary'>
          {course.title}
        </h3>

        <div className='flex items-center gap-4 text-xs text-muted-foreground'>
          <span className='flex items-center gap-1.5'>
            <BookOpen className='size-3.5' />
            {t('lessons', { count: course.totalLectures })}
          </span>
          <span className='flex items-center gap-1.5'>
            <Users className='size-3.5' />
            {t('students', { count: course.studentCount })}
          </span>
        </div>

        {course.subtitle && <p className='line-clamp-2 text-sm text-muted-foreground'>{course.subtitle}</p>}

        {/* mt-auto: đẩy phần dưới xuống đáy thẻ → thẻ nào cũng thẳng hàng dù nội dung dài ngắn khác nhau */}
        <div className='mt-auto flex flex-col gap-3 pt-1'>
          <span className='flex min-w-0 items-center gap-2 text-sm'>
            <Avatar className='size-6'>
              <AvatarImage src={course.instructor.avatar ?? undefined} alt={course.instructor.name} />
              <AvatarFallback className='text-[10px]'>{course.instructor.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className='truncate text-muted-foreground'>
              <span className='font-medium text-foreground'>{course.instructor.name}</span> · {course.category.name}
            </span>
          </span>

          <div className='flex items-center justify-between gap-3 border-t pt-3'>
            {/* Khóa có phí: giá màu san hô (màu nhấn ấm) cho nổi bật. Miễn phí: màu xanh thương hiệu */}
            <span className={cn('text-lg font-bold', course.price > 0 ? 'text-highlight' : 'text-primary')}>
              {formatPrice(course.price, locale)}
            </span>
            <span className='flex items-center gap-1 text-sm font-medium text-primary'>
              {t('viewDetail')}
              <ArrowRight className='size-4 transition-transform group-hover:translate-x-0.5' />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// Thẻ giả lúc đang tải: cùng khung với CourseCard để trang không bị nhảy khi dữ liệu về
export function CourseCardSkeleton() {
  return (
    <div className='flex flex-col rounded-3xl border bg-card p-3'>
      <Skeleton className='aspect-video rounded-2xl' />
      <div className='flex flex-col gap-2.5 p-4'>
        <Skeleton className='h-3 w-1/3' />
        <Skeleton className='h-5 w-full' />
        <Skeleton className='h-3 w-1/2' />
        <Skeleton className='h-8 w-full' />
        <Skeleton className='mt-2 h-6 w-1/2' />
      </div>
    </div>
  )
}
