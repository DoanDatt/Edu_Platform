import { Badge } from '@/components/ui/badge'
import { CourseLevelLabels } from '@/constants/type'
import { formatPrice, generateSlugUrl } from '@/lib/format'
import { PublicCourseType } from '@/schemaValidations/course.schema'
import { ImageOff, Star, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// Thẻ 1 khóa học. Cả thẻ là 1 link tới trang chi tiết
export default function CourseCard({ course }: { course: PublicCourseType }) {
  // Link dạng slug: /courses/react-tu-co-ban-den-nang-cao-i.15
  const href = `/courses/${generateSlugUrl({ name: course.title, id: course.id })}`

  const price = formatPrice(course.price)
  return (
    <Link
      href={href}
      className='group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md'
    >
      {/* Ảnh bìa tỉ lệ 16:9. Không có ảnh → khung xám + icon */}
      <div className='relative aspect-video overflow-hidden bg-muted'>
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            sizes='(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'
            className='object-cover transition-transform duration-300 group-hover:scale-[1.02]'
          />
        ) : (
          <div className='flex size-full items-center justify-center text-muted-foreground'>
            <ImageOff className='size-8' />
          </div>
        )}
      </div>

      <div className='flex flex-1 flex-col gap-2 p-4'>
        <div className='flex flex-wrap gap-1.5'>
          <Badge variant='secondary'>{course.category.name}</Badge>
          <Badge variant='outline'>{CourseLevelLabels[course.level]}</Badge>
        </div>

        {/* line-clamp-2: tên dài quá 2 dòng thì cắt bằng "..." để các thẻ cao bằng nhau */}
        <h3 className='line-clamp-2 font-semibold leading-snug group-hover:text-primary'>{course.title}</h3>
        <p className='text-sm text-muted-foreground'>{course.instructor.name}</p>

        <div className='flex items-center gap-3 text-sm'>
          {course.rating.totalReviews > 0 ? (
            <span className='flex items-center gap-1'>
              <Star className='size-4 fill-amber-400 text-amber-400' />
              <span className='font-semibold'>{course.rating.averageRating}</span>
              <span className='text-muted-foreground'>({course.rating.totalReviews})</span>
            </span>
          ) : (
            <span className='text-muted-foreground'>Chưa có đánh giá</span>
          )}
          <span className='flex items-center gap-1 text-muted-foreground'>
            <Users className='size-4' />
            {course.studentCount}
          </span>
        </div>

        {/* mt-auto: đẩy giá xuống đáy thẻ, thẻ nào cũng thẳng hàng */}
        <p className='mt-auto pt-2 text-lg font-bold'>{price}</p>
      </div>
    </Link>
  )
}
