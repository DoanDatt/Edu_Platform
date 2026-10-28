import { cn } from '@/lib/utils'
import Waves from './waves'

// Dải tiêu đề màu xanh có sóng ở đầu các trang danh sách (Khóa học, Khóa của tôi...):
// cùng phong cách banner trang chủ nhưng thấp hơn. Tiêu đề là h1 của trang.
// children: nội dung thêm bên dưới mô tả (vd số liệu nhỏ)
export default function PageBanner({
  eyebrow,
  title,
  description,
  children,
  className
}: {
  eyebrow?: string
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-3xl bg-linear-to-br from-sky-400 via-sky-500 to-blue-600 px-6 pt-8 pb-14 text-white md:px-10 dark:from-sky-600 dark:via-sky-700 dark:to-blue-800',
        className
      )}
    >
      <div aria-hidden className='absolute -top-20 -right-16 size-72 rounded-full bg-white/20 blur-3xl' />
      <Waves className='h-2/5' />
      <div className='relative flex max-w-2xl flex-col gap-2'>
        {eyebrow && <span className='text-xs font-semibold tracking-widest text-white/80 uppercase'>{eyebrow}</span>}
        <h1 className='text-3xl font-bold md:text-4xl'>{title}</h1>
        {description && <p className='text-white/90 md:text-lg'>{description}</p>}
        {children}
      </div>
    </section>
  )
}
