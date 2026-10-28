import CourseCover from '@/components/course-cover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { CourseLevelLabels } from '@/constants/type'
import { formatPrice, generateSlugUrl } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PublicCourseType } from '@/schemaValidations/course.schema'
import { Star, Users } from 'lucide-react'
import Link from 'next/link'

// Thẻ 1 khóa học. Cả thẻ là 1 link tới trang chi tiết.
// Phong cách: nền trắng, viền mảnh pha xanh, bo góc lớn. Rê chuột: nổi lên, viền + bóng đổ ngả màu xanh thương hiệu
export default function CourseCard({ course }: { course: PublicCourseType }) {
  // Link dạng slug: /courses/react-tu-co-ban-den-nang-cao-i.15
  const href = `/courses/${generateSlugUrl({ name: course.title, id: course.id })}`

  return (
    <Link
      href={href}
      className='group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10'
    >
      <CourseCover
        course={course}
        sizes='(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'
      />

      <div className='flex flex-1 flex-col gap-1.5 p-4'>
        <span className='text-xs font-medium text-muted-foreground'>{CourseLevelLabels[course.level]}</span>
        {/* line-clamp-2: tên dài quá 2 dòng thì cắt bằng "..." để các thẻ cao bằng nhau */}
        <h3 className='line-clamp-2 font-semibold leading-snug transition-colors group-hover:text-primary'>
          {course.title}
        </h3>
        {/* Khóa có phí: giá màu san hô (màu nhấn ấm) cho nổi bật. Miễn phí: màu xanh thương hiệu */}
        <p className={cn('font-bold', course.price > 0 ? 'text-highlight' : 'text-primary')}>
          {formatPrice(course.price)}
        </p>

        {/* mt-auto: đẩy hàng cuối xuống đáy thẻ → thẻ nào cũng thẳng hàng */}
        <div className='mt-auto flex items-center justify-between gap-3 pt-3 text-sm text-muted-foreground'>
          <span className='flex min-w-0 items-center gap-2'>
            <Avatar className='size-6'>
              <AvatarImage src={course.instructor.avatar ?? undefined} alt={course.instructor.name} />
              <AvatarFallback className='text-[10px]'>{course.instructor.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className='truncate'>{course.instructor.name}</span>
          </span>
          <span className='flex shrink-0 items-center gap-3'>
            {course.rating.totalReviews > 0 && (
              <span className='flex items-center gap-1'>
                <Star className='size-3.5 fill-amber-400 text-amber-400' />
                <span className='font-medium text-foreground'>{course.rating.averageRating}</span>
              </span>
            )}
            <span className='flex items-center gap-1' title='Học viên'>
              <Users className='size-3.5' />
              {course.studentCount}
            </span>
          </span>
        </div>
      </div>
    </Link>
  )
}

// Thẻ giả lúc đang tải: cùng khung với CourseCard để trang không bị nhảy khi dữ liệu về
export function CourseCardSkeleton() {
  return (
    <div className='flex flex-col overflow-hidden rounded-2xl border bg-card'>
      <Skeleton className='aspect-video rounded-none' />
      <div className='flex flex-col gap-2 p-4'>
        <Skeleton className='h-3 w-1/4' />
        <Skeleton className='h-5 w-full' />
        <Skeleton className='h-4 w-1/3' />
        <Skeleton className='mt-3 h-6 w-1/2' />
      </div>
    </div>
  )
}
