'use client'

import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

// Nhãn theo số sao (1–5), chữ ở messages/*.json namespace "StarInput"
const LABELS = ['', 'terrible', 'poor', 'average', 'good', 'excellent'] as const

// Ô chọn số sao 1–5. Không phải <input> thường → nối với react-hook-form bằng <Controller>
// (truyền value / onChange giống 1 ô input). value = 0 nghĩa là chưa chọn
export default function StarInput({
  value,
  onChange,
  invalid
}: {
  value: number
  onChange: (value: number) => void
  invalid?: boolean
}) {
  const t = useTranslations('StarInput')
  // hover: số sao đang rê chuột qua (0 = không rê). Rê chuột thì sáng theo hover, không thì theo value
  const [hover, setHover] = useState(0)
  const shown = hover || value

  return (
    <div className='flex items-center gap-3'>
      {/* role='radiogroup' + aria: trình đọc màn hình hiểu đây là nhóm lựa chọn 1 trong 5 */}
      <div
        role='radiogroup'
        aria-label={t('label')}
        aria-invalid={invalid}
        className='flex items-center gap-1'
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type='button' // type='button': bấm sao KHÔNG gửi form (nút trong form mặc định là submit)
            role='radio'
            aria-checked={value === star}
            aria-label={t('stars', { count: star })}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            className='rounded-sm p-0.5 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-ring'
          >
            <Star
              className={cn('size-7', star <= shown ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40')}
            />
          </button>
        ))}
      </div>
      <span className='text-sm text-muted-foreground'>
        {shown > 0 && t(LABELS[shown] as Exclude<(typeof LABELS)[number], ''>)}
      </span>
    </div>
  )
}
