import { cn } from '@/lib/utils'
import { GraduationCap } from 'lucide-react'
import Link from 'next/link'

// Logo dùng chung: header, menu điện thoại, footer
export default function Logo({ className }: { className?: string }) {
  return (
    <Link href='/' className={cn('flex shrink-0 items-center gap-2 font-semibold', className)}>
      <span className='flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
        <GraduationCap className='size-5' />
      </span>
      <span className='text-lg tracking-tight'>EduPlatform</span>
    </Link>
  )
}
