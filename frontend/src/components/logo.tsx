import { cn } from '@/lib/utils'
import { Link } from '@/i18n/navigation'

// Biểu tượng riêng của EduPlatform: quyển sách mở, nét cam (màu thương hiệu) như logo EduPress — không nền ô vuông.
// Trên nền màu (panel thương hiệu) truyền className đổi màu nét, vd 'text-white'
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn('flex size-7 shrink-0 items-center justify-center text-primary sm:size-9', className)}>
      <svg aria-hidden viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' className='size-7 sm:size-8'>
        <path
          d='M2.5 5c3.2-1.3 6.3-1 9.5 1.2C15.2 4 18.3 3.7 21.5 5v13c-3.2-1.3-6.3-1-9.5 1.2-3.2-2.2-6.3-2.5-9.5-1.2z'
          strokeLinejoin='round'
          className='fill-current/15'
        />
        <path d='M12 6.2v13' />
      </svg>
    </span>
  )
}

// Logo dùng chung: header, menu điện thoại, footer. Chữ Exo Bold như EduPress
export default function Logo({ className }: { className?: string }) {
  return (
    <Link href='/' className={cn('flex shrink-0 items-center gap-1', className)}>
      <LogoMark />
      {/* Điện thoại: chữ nhỏ hơn để header 1 hàng còn đủ chỗ cho nút menu */}
      <span className='font-heading text-lg leading-none font-bold sm:text-[26px]'>EduPlatform</span>
    </Link>
  )
}
