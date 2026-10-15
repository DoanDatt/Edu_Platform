'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import adminMenuItems from './menu-items'

// Danh sách link trong sidebar, dùng chung cho sidebar máy tính và menu trượt điện thoại
export default function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className='flex flex-col gap-1'>
      {adminMenuItems.map(({ title, href, Icon }) => {
        // '/admin' (Dashboard) phải so sánh bằng, không thì trang admin nào cũng tô đậm Dashboard
        const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <Icon className='size-4' />
            {title}
          </Link>
        )
      })}
    </nav>
  )
}
