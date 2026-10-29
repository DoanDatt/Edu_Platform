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
        eyebrow='Cảm nhận'
        title='Học viên nói gì về EduPlatform'
        description='Đánh giá thật từ học viên đã học khóa đó'
      />
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {reviews.map((review) => (
          <figure key={review.id} className='relative flex flex-col gap-4 rounded-2xl border bg-card p-5'>
            {/* Dấu ngoặc kép lớn mờ ở góc: trang trí, nhìn là biết đây là lời nhận xét */}
            <Quote aria-hidden className='absolute top-4 right-4 size-10 text-primary/10' />
            <RatingStars value={review.rating} />
            <blockquote className='line-clamp-4 text-sm leading-relaxed'>“{review.comment}”</blockquote>
            <figcaption className='mt-auto flex items-center gap-3 border-t pt-4'>
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
