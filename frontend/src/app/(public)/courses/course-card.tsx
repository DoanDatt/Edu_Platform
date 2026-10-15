import CourseThumbnail from '@/components/course-thumbnail'
import RatingStars from '@/components/rating-stars'
import { Badge } from '@/components/ui/badge'
import { CourseLevelLabels } from '@/constants/type'
import { formatPrice, generateSlugUrl } from '@/lib/format'
import { PublicCourseType } from '@/schemaValidations/course.schema'
import { Users } from 'lucide-react'
import Link from 'next/link'

// Thẻ 1 khóa học trong danh sách. Cả thẻ là 1 link tới trang chi tiết
export default function CourseCard({ course }: { course: PublicCourseType }) {
  const href = `/courses/${generateSlugUrl({ name: course.title, id: course.id })}`

  return (
    <Link
      href={href}
      className='group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md'
    >
      <CourseThumbnail
        src={course.thumbnail}
        alt={course.title}
        className='transition-transform duration-300 group-hover:scale-[1.02]'
      />
      <div className='flex flex-1 flex-col gap-2 p-4'>
        <div className='flex flex-wrap gap-1.5'>
          <Badge variant='secondary'>{course.category.name}</Badge>
          <Badge variant='outline'>{CourseLevelLabels[course.level]}</Badge>
        </div>

        {/* line-clamp-2: tên dài quá 2 dòng thì cắt bằng "..." để các thẻ cao đều nhau */}
        <h3 className='line-clamp-2 font-semibold leading-snug group-hover:text-primary'>{course.title}</h3>
        <p className='text-sm text-muted-foreground'>{course.instructor.name}</p>

        <div className='flex items-center gap-1.5 text-sm'>
          {course.rating.totalReviews > 0 ? (
            <>
              <span className='font-semibold text-amber-600 dark:text-amber-400'>{course.rating.averageRating}</span>
              <RatingStars value={course.rating.averageRating} />
              <span className='text-muted-foreground'>({course.rating.totalReviews})</span>
            </>
          ) : (
            <span className='text-muted-foreground'>Chưa có đánh giá</span>
          )}
        </div>

        {/* mt-auto: đẩy dòng giá xuống đáy thẻ, các thẻ trên cùng 1 hàng thẳng hàng nhau */}
        <div className='mt-auto flex items-center justify-between pt-2'>
          <span className='font-bold'>{formatPrice(course.price)}</span>
          <span className='flex items-center gap-1 text-xs text-muted-foreground'>
            <Users className='size-3.5' />
            {course.studentCount} học viên
          </span>
        </div>
      </div>
    </Link>
  )
}
