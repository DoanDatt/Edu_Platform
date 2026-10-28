import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

// Thẻ 1 con số trên dashboard (giảng viên, admin): tiêu đề, số to, dòng ghi chú nhỏ, icon bên phải
export default function StatCard({
  title,
  value,
  note,
  Icon
}: {
  title: string
  value: number | string
  note?: string
  Icon: LucideIcon
}) {
  return (
    <Card>
      <CardContent className='flex items-start justify-between gap-4'>
        <div className='flex flex-col gap-1'>
          <span className='text-sm text-muted-foreground'>{title}</span>
          <span className='text-3xl font-bold tabular-nums'>{value}</span>
          {note && <span className='text-xs text-muted-foreground'>{note}</span>}
        </div>
        <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
          <Icon className='size-5' />
        </span>
      </CardContent>
    </Card>
  )
}
