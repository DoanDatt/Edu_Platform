import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'

// 5 ngôi sao, tô vàng theo điểm (làm tròn): 4.5 → 5 sao vàng, 3.4 → 3 sao vàng
// Dùng chung cho thẻ khóa học, đầu trang chi tiết, khối đánh giá
export default function RatingStars({ value, className }: { value: number; className?: string }) {
  const filled = Math.round(value)
  return (
    // aria-label: trình đọc màn hình đọc "4.5 trên 5 sao" thay vì 5 icon vô nghĩa
    <span className='inline-flex items-center gap-0.5' aria-label={`${value} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'size-4',
            star <= filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40',
            className
          )}
        />
      ))}
    </span>
  )
}
