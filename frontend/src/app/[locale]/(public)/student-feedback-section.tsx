import reviewApiRequest from '@/apiRequests/review'
import TopHeading from '@/components/top-heading'
import { Skeleton } from '@/components/ui/skeleton'
import { generateSlugUrl } from '@/lib/format'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

// "Student Feedbacks" theo Figma EduPress (node 1:1392): tiêu đề canh giữa + 4 thẻ 300px cách nhau 30px.
// Mỗi thẻ: dấu ngoặc kép xám, lời nhận xét, tên (H4 20px), dòng phụ (Figma ghi nghề nghiệp, ở đây là khóa đã học).
// Đánh giá THẬT (4–5 sao, có nhận xét) từ GET /reviews/featured. Async Server Component → page.tsx bọc <Suspense>
export default async function StudentFeedbackSection() {
  const reviews = await reviewApiRequest
    .featured(4)
    .then((res) => res.payload.data)
    .catch(() => [])

  // Ít quá thì nhìn trống trải, giống web chưa ai dùng → ẩn cả khối
  if (reviews.length < 2) return null
  const t = await getTranslations('Testimonials')

  return (
    <section className='flex flex-col gap-[50px]'>
      <TopHeading align='center' title={t('title')} description={t('description')} />
      {/* flex-wrap + justify-center: ít đánh giá (2–3) thì các thẻ nằm giữa hàng, không lệch trái */}
      <div className='flex flex-wrap justify-center gap-[30px]'>
        {reviews.map((review) => (
          <figure
            key={review.id}
            className='flex w-full flex-col justify-between gap-[30px] rounded-[20px] border bg-card px-[30px] py-10 sm:w-[calc(50%-15px)] lg:w-[300px]'
          >
            <div className='flex flex-col gap-5'>
              <Image src='/edupress/home/quote.svg' alt='' width={36} height={30} className='h-[29.8px] w-[35.5px]' />
              {/* line-clamp-6: nhận xét dài thì cắt bớt để 4 thẻ cao gần bằng nhau */}
              <blockquote className='line-clamp-6 text-lg leading-normal'>{review.comment}</blockquote>
            </div>
            <figcaption className='flex flex-col gap-2'>
              <span className='font-heading text-xl leading-[1.2] font-semibold capitalize'>{review.user.name}</span>
              <Link
                href={`/courses/${generateSlugUrl({ name: review.course.title, id: review.course.id })}`}
                className='line-clamp-1 text-lg leading-normal text-muted-foreground hover:text-primary'
              >
                {review.course.title}
              </Link>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

export function StudentFeedbackSkeleton() {
  return (
    <div className='flex flex-col gap-[50px]'>
      <Skeleton className='mx-auto h-[77px] w-full max-w-md' />
      <div className='grid gap-[30px] sm:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className='h-[408px] rounded-[20px]' />
        ))}
      </div>
    </div>
  )
}
