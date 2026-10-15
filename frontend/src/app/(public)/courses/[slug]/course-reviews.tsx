import RatingStars from '@/components/rating-stars'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDate } from '@/lib/format'
import { RatingSummaryType, ReviewType } from '@/schemaValidations/review.schema'

// Khối đánh giá: điểm trung bình + thanh phân bố 5 → 1 sao + vài đánh giá mới nhất
export default function CourseReviews({ rating, reviews }: { rating: RatingSummaryType; reviews: ReviewType[] }) {
  if (rating.totalReviews === 0) {
    return <p className='text-sm text-muted-foreground'>Khóa học chưa có đánh giá nào.</p>
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-6 sm:flex-row sm:items-center'>
        <div className='flex flex-col items-center gap-1 sm:w-32'>
          <span className='text-5xl font-bold text-amber-600 dark:text-amber-400'>{rating.averageRating}</span>
          <RatingStars value={rating.averageRating} />
          <span className='text-xs text-muted-foreground'>{rating.totalReviews} đánh giá</span>
        </div>

        <div className='flex flex-1 flex-col gap-1.5'>
          {[5, 4, 3, 2, 1].map((star) => {
            // distribution có key là CHUỖI: { "5": 3, "4": 1, ... }
            const count = rating.distribution[String(star)] ?? 0
            const percent = Math.round((count / rating.totalReviews) * 100)
            return (
              <div key={star} className='flex items-center gap-3 text-sm'>
                <span className='w-10 text-muted-foreground'>{star} sao</span>
                <div className='h-2 flex-1 overflow-hidden rounded-full bg-muted'>
                  <div className='h-full rounded-full bg-amber-400' style={{ width: `${percent}%` }} />
                </div>
                <span className='w-10 text-right tabular-nums text-muted-foreground'>{percent}%</span>
              </div>
            )
          })}
        </div>
      </div>

      <ul className='flex flex-col divide-y'>
        {reviews.map((review) => (
          <li key={review.id} className='flex gap-3 py-4'>
            <Avatar>
              <AvatarImage src={review.user.avatar ?? undefined} alt={review.user.name} />
              <AvatarFallback>{review.user.name.trim().split(/\s+/).pop()?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className='flex flex-1 flex-col gap-1'>
              <div className='flex flex-wrap items-center gap-2'>
                <span className='font-medium'>{review.user.name}</span>
                <RatingStars value={review.rating} />
                <span className='text-xs text-muted-foreground'>{formatDate(review.createdAt)}</span>
              </div>
              {review.comment && <p className='text-sm text-muted-foreground'>{review.comment}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
