import { cn } from '@/lib/utils'

// 2 đường sóng tuần hoàn rộng 1200 (đầu và cuối cùng độ cao, cùng hướng) → đặt 2 đoạn nối tiếp nhau là liền mạch
const BACK_WAVE = 'M0 60 C100 35 200 35 300 60 S500 85 600 60 S800 35 900 60 S1100 85 1200 60 V120 H0 Z'
const FRONT_WAVE =
  'M0 85 C70 70 130 70 200 85 S330 100 400 85 S530 70 600 85 S730 100 800 85 S930 70 1000 85 S1130 100 1200 85 V120 H0 Z'

// 1 lớp sóng: rộng gấp đôi khung, vẽ 2 đoạn sóng giống hệt nhau cạnh nhau (đoạn 2 dịch sang phải 1200)
function WaveLayer({ d, className }: { d: string; className?: string }) {
  return (
    <div className={cn('absolute inset-y-0 left-0 w-[200%]', className)}>
      <svg viewBox='0 0 2400 120' preserveAspectRatio='none' className='size-full'>
        <path d={d} />
        <path d={d} transform='translate(1200 0)' />
      </svg>
    </div>
  )
}

// Họa tiết sóng biển: điểm nhận diện riêng của EduPlatform (banner trang chủ, ảnh bìa khóa học tự vẽ).
// 2 lớp sóng trắng mờ chồng lệch nhau, nằm sát đáy khối cha (khối cha cần relative + overflow-hidden).
// animated: 2 lớp trôi sang trái với tốc độ khác nhau (chỉ dùng ở banner; ảnh bìa đứng yên cho đỡ rối mắt)
export default function Waves({ className, animated = false }: { className?: string; animated?: boolean }) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-x-0 bottom-0 h-1/3 overflow-hidden', className)}>
      <WaveLayer d={BACK_WAVE} className={cn('fill-white/10', animated && 'motion-safe:animate-wave-slow')} />
      <WaveLayer d={FRONT_WAVE} className={cn('fill-white/15', animated && 'motion-safe:animate-wave')} />
    </div>
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
