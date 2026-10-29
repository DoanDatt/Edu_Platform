import reviewApiRequest from '@/apiRequests/review'
import RatingStars from '@/components/rating-stars'
import SectionHeading from '@/components/section-heading'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { generateSlugUrl } from '@/lib/format'
import { Quote } from 'lucide-react'
import Link from 'next/link'

// Khối "Học viên nói gì" ở trang chủ: đánh giá THẬT (4–5 sao, có nhận xét) của học viên đã ghi danh.
// Async Server Component gọi API → ở page.tsx phải bọc <Suspense>
export default async function TestimonialSection() {
  // Lỗi API → coi như không có đánh giá: trang chủ không sập chỉ vì 1 khối
  const reviews = await reviewApiRequest
    .featured(6)
    .then((res) => res.payload.data)
    .catch(() => [])

  // Ít quá thì nhìn trống trải, giống web chưa ai dùng → ẩn cả khối
  if (reviews.length < 2) return null

  return (
    <section className='flex flex-col gap-6'>
      <SectionHeading
        align='center'
        eyebrow='Cảm nhận'
        title='Học viên nói gì về EduPlatform'
        description='Đánh giá thật từ học viên đã học khóa đó'
      />
      {/* flex-wrap + justify-center: ít đánh giá (2 thẻ) thì vẫn nằm giữa, thẳng với tiêu đề canh giữa */}
      <div className='flex flex-wrap justify-center gap-4'>
        {reviews.map((review) => (
          <figure
            key={review.id}
            className='relative flex w-full flex-col gap-4 rounded-2xl bg-accent/60 p-6 transition-all md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] duration-300 hover:-translate-y-1 hover:bg-card hover:shadow-xl hover:shadow-primary/10'
          >
            {/* Dấu ngoặc kép lớn mờ ở góc: trang trí, nhìn là biết đây là lời nhận xét */}
            <Quote aria-hidden className='absolute top-5 right-5 size-12 text-primary/15' />
            <RatingStars value={review.rating} />
            <blockquote className='line-clamp-4 text-sm leading-relaxed'>“{review.comment}”</blockquote>
            <figcaption className='mt-auto flex items-center gap-3 border-t border-primary/10 pt-4'>
              <Avatar className='size-10'>
                <AvatarImage src={review.user.avatar ?? undefined} alt={review.user.name} />
                <AvatarFallback>{review.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className='flex min-w-0 flex-col'>
                <span className='font-semibold'>{review.user.name}</span>
                <Link
                  href={`/courses/${generateSlugUrl({ name: review.course.title, id: review.course.id })}`}
                  className='truncate text-xs text-muted-foreground hover:text-primary'
                >
                  Học viên khóa {review.course.title}
                </Link>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

export function TestimonialSectionSkeleton() {
  return (
    <div className='flex flex-col gap-6'>
      <Skeleton className='h-16 w-72' />
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className='h-52 rounded-2xl' />
        ))}
      </div>
    </div>
  )
}
