import RatingStars from '@/components/rating-stars'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDate } from '@/lib/format'
import { RatingSummaryType, ReviewType } from '@/schemaValidations/review.schema'
import { MessageSquare } from 'lucide-react'

// Khối đánh giá: điểm trung bình + thanh phân bố số sao + danh sách đánh giá mới nhất
export default function CourseReviews({ rating, reviews }: { rating: RatingSummaryType; reviews: ReviewType[] }) {
  // Chưa ai đánh giá → trạng thái rỗng (không vẽ thanh 0% vô nghĩa)
  if (rating.totalReviews === 0) {
    return (
      <div className='flex flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-center'>
        <MessageSquare className='size-8 text-muted-foreground' />
        <p className='font-medium'>Chưa có đánh giá nào</p>
        <p className='text-sm text-muted-foreground'>Hãy là người đầu tiên đánh giá sau khi học.</p>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-6 sm:flex-row sm:items-center'>
        {/* Điểm trung bình */}
        <div className='flex flex-col items-center gap-1 sm:w-32'>
          <span className='text-5xl font-bold text-amber-600 dark:text-amber-400'>{rating.averageRating}</span>
          <RatingStars value={rating.averageRating} className='size-3.5' />
          <span className='text-xs text-muted-foreground'>{rating.totalReviews} đánh giá</span>
        </div>

        {/* Phân bố số sao: 5 sao ở trên cùng */}
        <div className='flex flex-1 flex-col gap-1.5'>
          {[5, 4, 3, 2, 1].map((star) => {
            // distribution có key là chuỗi '1'...'5' → đọc bằng String(star). Không có → 0
            const count = rating.distribution[String(star)] ?? 0
            // Phần trăm = số đánh giá mức này / tổng × 100. totalReviews > 0 (đã kiểm tra ở trên) nên không chia cho 0
            const percent = Math.round((count / rating.totalReviews) * 100)
            return (
              <div key={star} className='flex items-center gap-3 text-sm'>
                <span className='w-10 text-muted-foreground'>{star} sao</span>
                <div className='h-2 flex-1 overflow-hidden rounded-full bg-muted'>
                  {/* Độ dài thanh màu = phần trăm. Tailwind không có class cho số tùy ý → dùng style */}
                  <div className='h-full rounded-full bg-amber-400' style={{ width: `${percent}%` }} />
                </div>
                <span className='w-10 text-right tabular-nums text-muted-foreground'>{percent}%</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Danh sách đánh giá (API trả về mới nhất trước) */}
      <ul className='flex flex-col divide-y'>
        {reviews.map((review) => (
          <li key={review.id} className='flex gap-3 py-4'>
            <Avatar className='size-9'>
              <AvatarImage src={review.user.avatar ?? undefined} alt={review.user.name} />
              {/* Không có ảnh → chữ cái đầu của tên */}
              <AvatarFallback>{review.user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className='flex flex-1 flex-col gap-1'>
              <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
                <span className='font-medium'>{review.user.name}</span>
                <RatingStars value={review.rating} className='size-3.5' />
                <span className='text-xs text-muted-foreground'>{formatDate(review.createdAt)}</span>
              </div>
              {/* comment rỗng ('') → không vẽ đoạn văn trống */}
              {review.comment && <p className='text-sm leading-relaxed text-muted-foreground'>{review.comment}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
