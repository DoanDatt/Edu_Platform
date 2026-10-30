import CourseCover from '@/components/course-cover'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from '@/i18n/navigation'
import { formatPrice, generateSlugUrl } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PublicCourseType } from '@/schemaValidations/course.schema'
import { BarChart3, FileText } from 'lucide-react'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'

// Thẻ khóa học dạng HÀNG NGANG cho chế độ xem danh sách (Figma EduPress, Course Listing):
// ảnh 410 × 250 bên trái (nhãn danh mục nền đen), bên phải: by giảng viên, tên, hàng thông tin
// (số học viên, trình độ, số bài, đánh giá), vạch ngăn, giá + View More.
// Điện thoại: ảnh nằm trên, chữ nằm dưới. Rê chuột: có bóng, tên chuyển cam
export default function CourseRow({ course }: { course: PublicCourseType }) {
  const t = useTranslations('Courses')
  const locale = useLocale()
  const href = `/courses/${generateSlugUrl({ name: course.title, id: course.id })}`

  return (
    <Link
      href={href}
      className='group flex flex-col overflow-hidden rounded-[20px] border bg-card transition-shadow duration-300 hover:shadow-[0_4px_10px_rgba(0,0,0,0.1)] md:flex-row'
    >
      <div className='relative shrink-0 md:w-[410px]'>
        <CourseCover course={course} className='aspect-[410/250] h-full' sizes='(min-width: 768px) 410px, 100vw' />
        <span className='absolute top-5 left-5 rounded-lg bg-black px-3 py-2 text-base leading-normal font-medium text-white'>
          {course.category.name}
        </span>
      </div>

      <div className='flex min-w-0 flex-1 flex-col gap-4 p-5 md:px-[30px] md:py-5'>
        <div className='flex flex-col gap-3'>
          <p className='text-base leading-normal text-muted-foreground'>
            {t.rich('byInstructor', {
              name: course.instructor.name,
              b: (chunks) => <span className='text-foreground'>{chunks}</span>
            })}
          </p>
          <h3 className='line-clamp-2 text-xl leading-[1.2] transition-colors group-hover:text-primary'>
            {course.title}
          </h3>
        </div>

        <div className='flex flex-wrap gap-x-6 gap-y-2 text-base leading-normal text-muted-foreground'>
          <span className='flex items-center gap-2'>
            <Image src='/edupress/icons/graduation-cap.svg' alt='' width={16} height={16} className='size-4' />
            {t('students', { count: course.studentCount })}
          </span>
          <span className='flex items-center gap-2'>
            <BarChart3 className='size-4 text-primary' />
            {t(`levels.${course.level}`)}
          </span>
          <span className='flex items-center gap-2'>
            <FileText className='size-4 text-primary' />
            {t('lessons', { count: course.totalLectures })}
          </span>
        </div>

        {/* mt-auto: đẩy giá xuống đáy thẻ, thẳng hàng với đáy ảnh */}
        <div className='mt-auto flex items-center justify-between gap-3 border-t pt-4 text-lg leading-normal font-medium'>
          <span className={cn(course.price === 0 && 'text-highlight')}>{formatPrice(course.price, locale)}</span>
          <span>{t('viewMore')}</span>
        </div>
      </div>
    </Link>
  )
}

export function CourseRowSkeleton() {
  return (
    <div className='flex flex-col overflow-hidden rounded-[20px] border bg-card md:flex-row'>
      <Skeleton className='aspect-[410/250] rounded-none md:w-[410px]' />
      <div className='flex flex-1 flex-col gap-4 p-5 md:px-[30px]'>
        <Skeleton className='h-4 w-1/3' />
        <Skeleton className='h-6 w-3/4' />
        <Skeleton className='h-4 w-1/2' />
        <Skeleton className='mt-auto h-7 w-full' />
      </div>
    </div>
  )
}
