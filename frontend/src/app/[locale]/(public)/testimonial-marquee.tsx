import reviewApiRequest from '@/apiRequests/review'
import FullBleed from '@/components/full-bleed'
import RatingStars from '@/components/rating-stars'
import SectionHeading from '@/components/section-heading'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { generateSlugUrl } from '@/lib/format'
import { FeaturedReviewType } from '@/schemaValidations/review.schema'
import { Quote } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'

// Ít nhất chừng này thẻ cho MỖI nửa băng chạy: ít đánh giá quá thì lặp lại danh sách cho đủ dài,
// không thì băng ngắn hơn màn hình → lộ khoảng trống khi chạy
const MIN_CARDS_PER_HALF = 8
// Mỗi thẻ chạy qua mất chừng này giây → nhiều thẻ thì chạy lâu hơn, tốc độ luôn đều, đủ chậm để đọc
const SECONDS_PER_CARD = 7

// Băng lời nhận xét chạy ngang liên tục ngay dưới banner. Rê chuột vào (hoặc Tab tới link trong thẻ) → dừng lại để đọc.
// Cách chạy liền mạch: dải = [danh sách][bản sao danh sách], trượt sang trái đúng 1 nửa (animate-marquee)
// → bản sao nằm đúng chỗ bản gốc lúc đầu → lặp lại không thấy chỗ nối.
// Người bật "giảm chuyển động": không chạy, thay bằng cuộn ngang bằng tay.
// Đánh giá THẬT (4–5 sao, có nhận xét) từ GET /reviews/featured. Async Server Component → page.tsx bọc <Suspense>
export default async function TestimonialMarquee() {
  const reviews = await reviewApiRequest
    .featured(12)
    .then((res) => res.payload.data)
    .catch(() => [])

  // Ít quá thì nhìn trống trải, giống web chưa ai dùng → ẩn cả khối
  if (reviews.length < 2) return null
  const t = await getTranslations('Testimonials')

  const half: FeaturedReviewType[] = []
  while (half.length < MIN_CARDS_PER_HALF) half.push(...reviews)

  return (
    <section className='flex flex-col gap-8'>
      <SectionHeading eyebrow={t('eyebrow')} title={t('title')} description={t('description')} />
      {/* Băng chạy hết chiều ngang màn hình (FullBleed, bỏ giới hạn 7xl của phần nội dung), mờ dần ở 2 mép */}
      <FullBleed innerClassName='max-w-none px-0'>
        <div className='group overflow-hidden mask-x-from-90% mask-x-to-100% motion-reduce:overflow-x-auto'>
          <div
            // Không dùng gap: gap tạo 2N−1 khoảng cho 2N thẻ → 2 nửa lệch nhau nửa khoảng, chỗ nối bị giật.
            // Mỗi thẻ tự có mr-5 → 2 nửa dài bằng nhau tuyệt đối
            className='flex w-max py-4 motion-safe:animate-marquee group-hover:paused group-focus-within:paused'
            style={{ animationDuration: `${half.length * SECONDS_PER_CARD}s` }}
          >
            {half.map((review, index) => (
              <TestimonialCard key={`a-${index}`} review={review} />
            ))}
            {/* Bản sao để chạy liền mạch: trình đọc màn hình bỏ qua, không Tab vào được */}
            {half.map((review, index) => (
              <TestimonialCard key={`b-${index}`} review={review} hidden />
            ))}
          </div>
        </div>
      </FullBleed>
    </section>
  )
}

function TestimonialCard({ review, hidden = false }: { review: FeaturedReviewType; hidden?: boolean }) {
  const t = useTranslations('Testimonials')

  return (
    <figure
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
      className='relative mr-5 flex w-80 shrink-0 flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 md:w-96'
    >
      {/* Dấu ngoặc kép lớn mờ ở góc: trang trí, nhìn là biết đây là lời nhận xét */}
      <Quote aria-hidden className='absolute top-4 right-4 size-10 text-primary/15' />
      <RatingStars value={review.rating} />
      <blockquote className='line-clamp-3 text-sm leading-relaxed'>“{review.comment}”</blockquote>
      <figcaption className='mt-auto flex items-center gap-3 border-t pt-3'>
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
            {t('studentOf', { course: review.course.title })}
          </Link>
        </div>
      </figcaption>
    </figure>
  )
}

export function TestimonialMarqueeSkeleton() {
  return (
    <div className='flex flex-col items-center gap-10'>
      <Skeleton className='h-24 w-full max-w-md' />
      <div className='flex w-full gap-5 overflow-hidden'>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className='h-44 w-80 shrink-0 rounded-2xl' />
        ))}
      </div>
    </div>
  )
}
