import { cn } from '@/lib/utils'
import { Link } from '@/i18n/navigation'

// Biểu tượng riêng của EduPlatform: quyển sách mở nằm trên con sóng (học + chủ đề biển)
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex size-8 items-center justify-center rounded-[10px] bg-linear-to-br from-sky-400 to-blue-600 text-white shadow-sm shadow-sky-500/30',
        className
      )}
    >
      <svg aria-hidden viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' className='size-5'>
        <path
          d='M3.5 5.5c2.8-1.1 5.6-.9 8.5 1 2.9-1.9 5.7-2.1 8.5-1v10c-2.8-1.1-5.6-.9-8.5 1-2.9-1.9-5.7-2.1-8.5-1z'
          strokeLinejoin='round'
          className='fill-white/20'
        />
        <path d='M12 6.5v10' />
        <path d='M3 20.5c1.5-1.2 3-1.2 4.5 0s3 1.2 4.5 0 3-1.2 4.5 0 3 1.2 4.5 0' strokeLinecap='round' />
      </svg>
    </span>
  )
}

// Logo dùng chung: header, menu điện thoại, footer
export default function Logo({ className }: { className?: string }) {
  return (
    <Link href='/' className={cn('flex shrink-0 items-center gap-2', className)}>
      <LogoMark />
      <span className='font-heading text-lg font-semibold'>
        Edu<span className='text-primary'>Platform</span>
      </span>
    </Link>
  )
}
