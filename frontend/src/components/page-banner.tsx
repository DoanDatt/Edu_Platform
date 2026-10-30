import BreadcrumbBar, { type Crumb } from '@/components/breadcrumb-bar'
import { cn } from '@/lib/utils'

// Đầu trang con theo EduPress: dải đường dẫn xám (Homepage > Courses) ngay dưới header,
// bên dưới là tiêu đề trang (h1, Exo 32px) + mô tả. Không còn banner màu như trang chủ.
//   breadcrumbs: các cấp ở giữa (vd Blog > tên bài). Không truyền thì chỉ có Trang chủ > title
//   breadcrumbLabel: tên ngắn cho mục cuối của đường dẫn khi tiêu đề trang dài (vd "Giới thiệu")
//   children: nội dung thêm bên dưới mô tả
export default function PageBanner({
  title,
  description,
  breadcrumbs = [],
  breadcrumbLabel,
  children,
  className
}: {
  title: string
  description?: string
  breadcrumbs?: Crumb[]
  breadcrumbLabel?: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-8 md:gap-10', className)}>
      <BreadcrumbBar items={[...breadcrumbs, { label: breadcrumbLabel ?? title }]} />
      <div className='flex flex-col gap-3'>
        <h1 className='text-[28px] leading-[1.2] capitalize md:text-[32px]'>{title}</h1>
        {description && <p className='text-lg leading-normal text-muted-foreground'>{description}</p>}
        {children}
      </div>
    </div>
  )
}
