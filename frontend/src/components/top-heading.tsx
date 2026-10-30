import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

// Tiêu đề khối theo EduPress ("Top heading" trong Figma): tiêu đề H2 32px + dòng mô tả 18px xám.
//   Có action: tiêu đề bên trái, nút viền xám bên phải ("All Categories", "All Courses")
//   align='center': tiêu đề canh giữa, không có nút ("Student Feedbacks")
export default function TopHeading({
  title,
  description,
  action,
  align = 'left',
  className
}: {
  title: string
  description?: string
  action?: { label: string; href: string }
  align?: 'left' | 'center'
  className?: string
}) {
  const centered = align === 'center'
  return (
    <div
      className={cn(
        'flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between',
        centered && 'sm:justify-center',
        className
      )}
    >
      <div className={cn('flex flex-col gap-3', centered && 'items-center text-center')}>
        <h2 className='text-[26px] leading-[1.2] capitalize md:text-[32px]'>{title}</h2>
        {description && <p className='text-lg leading-normal text-muted-foreground'>{description}</p>}
      </div>
      {action && (
        <Button asChild variant='bordered' size='pill' className='self-start sm:self-auto'>
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  )
}
