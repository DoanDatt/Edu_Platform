import { cn } from '@/lib/utils'

// Tiêu đề 1 khối trên trang chủ: dòng chữ nhỏ màu san hô ở trên (eyebrow) + tiêu đề + mô tả.
// Mọi khối dùng chung → trang có nhịp đồng đều, nhìn là biết bắt đầu 1 phần mới
export default function SectionHeading({
  eyebrow,
  title,
  description,
  className
}: {
  eyebrow: string
  title: string
  description?: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <span className='flex items-center gap-2 text-xs font-semibold tracking-widest text-highlight uppercase'>
        <span aria-hidden className='h-0.5 w-6 rounded-full bg-highlight' />
        {eyebrow}
      </span>
      <h2 className='text-2xl font-bold md:text-3xl'>{title}</h2>
      {description && <p className='text-muted-foreground'>{description}</p>}
    </div>
  )
}
