import CourseCover from '@/components/course-cover'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice, generateSlugUrl } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PublicCourseType } from '@/schemaValidations/course.schema'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'

// Thẻ khóa học theo Figma EduPress (component "Courses", node 1:1319). Cả thẻ là 1 link tới trang chi tiết.
// Từ trên xuống: ảnh 410 × 250 (nhãn danh mục nền đen ở góc) · "by giảng viên" · tên · số bài + số học viên
// · vạch ngăn · giá + "View More".
// Rê chuột (Figma vẽ sẵn trạng thái hover ở thẻ giữa): thẻ nhô lên 16px, có bóng, tên chuyển cam
export default function CourseCard({ course }: { course: PublicCourseType }) {
  const t = useTranslations('Courses')
  const locale = useLocale()
  // Link dạng slug: /courses/react-tu-co-ban-den-nang-cao-i.15
  const href = `/courses/${generateSlugUrl({ name: course.title, id: course.id })}`

  return (
    <Link
      href={href}
      className='group flex flex-col overflow-hidden rounded-[20px] border bg-card transition-all duration-300 hover:-translate-y-4 hover:shadow-[0_4px_10px_rgba(0,0,0,0.1)]'
    >
      <div className='relative'>
        <CourseCover
          course={course}
          className='aspect-[410/250]'
          sizes='(min-width: 1024px) 410px, (min-width: 640px) 50vw, 100vw'
        />
        <span className='absolute top-5 left-5 rounded-lg bg-black px-3 py-2 text-base leading-normal font-medium text-white'>
          {course.category.name}
        </span>
      </div>

      <div className='flex flex-1 flex-col gap-4 p-5'>
        <div className='flex flex-col gap-3'>
          <p className='text-base leading-normal text-muted-foreground'>
            {t.rich('byInstructor', {
              name: course.instructor.name,
              b: (chunks) => <span className='text-foreground'>{chunks}</span>
            })}
          </p>
          {/* line-clamp-2: tên dài quá 2 dòng thì cắt "..." để các thẻ cao bằng nhau */}
          <h3 className='line-clamp-2 text-xl leading-[1.2] transition-colors group-hover:text-primary'>
            {course.title}
          </h3>
        </div>

        <div className='flex flex-wrap gap-x-6 gap-y-2 text-base leading-normal text-muted-foreground'>
          <span className='flex items-center gap-2'>
            <Image src='/edupress/icons/clock.svg' alt='' width={16} height={16} className='size-4' />
            {t('lessons', { count: course.totalLectures })}
          </span>
          <span className='flex items-center gap-2'>
            <Image src='/edupress/icons/graduation-cap.svg' alt='' width={16} height={16} className='size-4' />
            {t('students', { count: course.studentCount })}
          </span>
        </div>

        {/* mt-auto: đẩy giá xuống đáy thẻ → các thẻ trong 1 hàng thẳng hàng dù tên dài ngắn khác nhau */}
        <div className='mt-auto flex items-center justify-between gap-3 border-t pt-4 text-lg leading-normal font-medium'>
          {/* Miễn phí: xanh lá như "Free" của Figma. Có phí: chữ thường */}
          <span className={cn(course.price === 0 && 'text-highlight')}>{formatPrice(course.price, locale)}</span>
          <span>{t('viewMore')}</span>
        </div>
      </div>
    </Link>
  )
}

// Thẻ giả lúc đang tải: cùng khung với CourseCard để trang không bị nhảy khi dữ liệu về
export function CourseCardSkeleton() {
  return (
    <div className='flex flex-col overflow-hidden rounded-[20px] border bg-card'>
      <Skeleton className='aspect-[410/250] rounded-none' />
      <div className='flex flex-col gap-4 p-5'>
        <Skeleton className='h-4 w-1/3' />
        <Skeleton className='h-6 w-full' />
        <Skeleton className='h-4 w-1/2' />
        <Skeleton className='mt-2 h-7 w-full' />
      </div>
    </div>
  )
}
