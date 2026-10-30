import { cn } from '@/lib/utils'

// Tiêu đề 1 khối theo kiểu EduPress: nhãn nhỏ in hoa (eyebrow) + tiêu đề H2 32px + mô tả 18px.
// Dùng cho các trang không có trong Figma (Giới thiệu...). Trang chủ dùng TopHeading (có nút bên phải).
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
      {/* Nhãn nhỏ kiểu EduPress ("GET MORE POWER FROM"): Exo 16px in hoa, xám */}
      <span className='font-heading text-base leading-[1.2] font-semibold text-muted-foreground uppercase'>
        {eyebrow}
      </span>
      <h2 className='text-[26px] leading-[1.2] text-balance md:text-[32px]'>{title}</h2>
      {description && <p className='text-lg leading-normal text-muted-foreground'>{description}</p>}
    </div>
  )
}
