import { cn } from '@/lib/utils'

// Tiêu đề 1 khối trên trang chủ: nhãn nhỏ dạng viên thuốc màu san hô (eyebrow) + tiêu đề + mô tả.
// Mọi khối dùng chung → trang có nhịp đồng đều, nhìn là biết bắt đầu 1 phần mới.
// align='center' (mặc định): khối giới thiệu / danh sách canh giữa; 'left': khối 2 cột (chữ một bên, hình một bên)
export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className
}: {
  eyebrow: string
  title: string
  description?: string
  align?: 'left' | 'center'
  className?: string
}) {
  const centered = align === 'center'
  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        centered ? 'mx-auto max-w-2xl items-center text-center' : 'items-start',
        className
      )}
    >
      <span className='rounded-full bg-highlight/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-highlight uppercase'>
        {eyebrow}
      </span>
      <h2 className='text-3xl leading-tight font-bold text-balance md:text-4xl'>{title}</h2>
      {description && <p className='text-muted-foreground md:text-lg'>{description}</p>}
    </div>
  )
}
