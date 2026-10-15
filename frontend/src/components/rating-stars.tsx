import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'

// 5 ngôi sao, tô vàng theo điểm làm tròn: 4.5 → 5 sao vàng, 4.4 → 4 sao vàng
export default function RatingStars({ value, className }: { value: number; className?: string }) {
  const filled = Math.round(value)
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${value} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn('size-3.5', star <= filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40')}
        />
      ))}
    </span>
  )
}
