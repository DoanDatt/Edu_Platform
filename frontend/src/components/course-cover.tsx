import { getCategoryStyle } from '@/constants/category'
import { cn } from '@/lib/utils'
import Image from 'next/image'

// Ảnh bìa khóa học, tỉ lệ 16:9.
//   Có thumbnail (giảng viên đã upload) → hiện ảnh thật
//   Chưa có → TỰ VẼ: nền gradient theo danh mục + tên khóa chữ to (học theo phong cách F8),
//   nhìn vẫn đẹp và đồng bộ, không cần ảnh minh họa
export default function CourseCover({
  course,
  size = 'md',
  sizes,
  priority,
  className
}: {
  course: { title: string; subtitle?: string; thumbnail: string | null; category: { id: number; name: string } }
  size?: 'sm' | 'md' | 'lg' // sm: ảnh nhỏ trong bảng · md: thẻ khóa học · lg: trang chi tiết (chữ to hơn)
  sizes?: string // thuộc tính sizes của next/image: ảnh hiển thị rộng bao nhiêu ở từng cỡ màn hình
  priority?: boolean // ảnh nằm ngay màn hình đầu (trang chi tiết) → tải sớm
  className?: string
}) {
  if (course.thumbnail) {
    return (
      <div className={cn('relative aspect-video overflow-hidden bg-muted', className)}>
        <Image
          src={course.thumbnail}
          alt={course.title}
          fill
          sizes={sizes}
          priority={priority}
          className='object-cover transition-transform duration-300 group-hover:scale-[1.03]'
        />
      </div>
    )
  }

  const { Icon, gradient } = getCategoryStyle(course.category)

  // sm: ảnh nhỏ (bảng khóa học của giảng viên) → chữ không đọc được, chỉ vẽ nền + icon danh mục
  if (size === 'sm') {
    return (
      <div
        className={cn('flex aspect-video items-center justify-center bg-linear-to-br text-white', gradient, className)}
      >
        <Icon className='size-5' />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative flex aspect-video flex-col justify-center overflow-hidden bg-linear-to-br text-white',
        gradient,
        size === 'lg' ? 'gap-3 p-8' : 'gap-2 p-5',
        className
      )}
    >
      {/* Sọc chéo mờ phủ lên nền cho bớt phẳng */}
      <div
        aria-hidden
        className='absolute inset-0 bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.07)_0_2px,transparent_2px_16px)]'
      />
      {/* Vòng tròn sáng mờ ở góc: tạo chiều sâu */}
      <div aria-hidden className='absolute -top-1/3 -right-1/4 size-2/3 rounded-full bg-white/15 blur-2xl' />

      <span
        className={cn(
          'relative flex w-fit items-center gap-1.5 rounded-full bg-black/20 px-2.5 py-1 font-medium backdrop-blur-sm',
          size === 'lg' ? 'text-sm' : 'text-xs'
        )}
      >
        <Icon className='size-3.5' />
        {course.category.name}
      </span>
      <p
        className={cn(
          'relative line-clamp-2 font-bold leading-tight tracking-tight drop-shadow-sm',
          size === 'lg' ? 'text-3xl md:text-4xl' : 'text-xl'
        )}
      >
        {course.title}
      </p>
      {course.subtitle && size === 'lg' && (
        <p className='relative line-clamp-1 text-white/85 md:text-lg'>{course.subtitle}</p>
      )}
      {/* Gạch ngang nhỏ dưới tên (điểm nhấn) */}
      <span aria-hidden className='relative h-1 w-10 rounded-full bg-white/70' />
    </div>
  )
}
