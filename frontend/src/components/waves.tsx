import { cn } from '@/lib/utils'

// Họa tiết sóng biển: điểm nhận diện riêng của EduPlatform (banner trang chủ, ảnh bìa khóa học tự vẽ).
// 2 lớp sóng trắng mờ chồng lệch nhau, nằm sát đáy khối cha (khối cha cần relative + overflow-hidden).
// preserveAspectRatio='none': sóng kéo giãn theo chiều ngang của khối, không bị cắt
export default function Waves({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox='0 0 1200 120'
      preserveAspectRatio='none'
      className={cn('pointer-events-none absolute inset-x-0 bottom-0 h-1/3 w-full', className)}
    >
      <path
        d='M0 60 C 150 20 300 20 450 55 S 750 100 900 60 S 1100 20 1200 45 V120 H0 Z'
        className='fill-white/10'
      />
      <path
        d='M0 85 C 200 55 350 60 520 85 S 850 115 1000 85 S 1150 65 1200 75 V120 H0 Z'
        className='fill-white/15'
      />
    </svg>
  )
}

// Gạch chân lượn sóng dưới 1 cụm chữ (tiêu đề banner). Màu theo currentColor → đặt class text-... để đổi màu
export function WavyUnderline({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox='0 0 200 12' preserveAspectRatio='none' className={cn('h-2.5 w-full', className)}>
      <path
        d='M2 7 C 20 2 35 2 52 7 S 85 12 102 7 S 135 2 152 7 S 185 12 198 6'
        fill='none'
        stroke='currentColor'
        strokeWidth='3.5'
        strokeLinecap='round'
      />
    </svg>
  )
}
