import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

// Khung thông báo nhỏ (lý do từ chối, đang chờ duyệt...) cho trang sửa thông tin và trang soạn nội dung
export default function CourseNotice({
  tone = 'default',
  Icon,
  children
}: {
  tone?: 'default' | 'destructive'
  Icon: LucideIcon
  children: React.ReactNode
}) {
  return (
    <p
      className={cn(
        'flex items-start gap-2 rounded-lg border p-3 text-sm',
        tone === 'destructive' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'bg-muted/40'
      )}
    >
      <Icon className='mt-0.5 size-4 shrink-0' />
      <span>{children}</span>
    </p>
  )
}
