import { getCategoryIcon, getCategoryStyle } from '@/constants/category'
import { cn } from '@/lib/utils'
import Image from 'next/image'

// Ảnh bìa khóa học, tỉ lệ 16:9 (nơi dùng có thể đổi tỉ lệ qua className, vd thẻ EduPress 410 × 250).
//   Có thumbnail (giảng viên đã upload) → hiện ảnh thật
//   Chưa có → TỰ VẼ theo phong cách EduPress: nền màu nhạt theo danh mục, icon cam của danh mục,
//   tên khóa chữ đen. Nền nhạt cố định ở cả giao diện tối (như một tấm ảnh) nên chữ luôn là màu đen
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

  const { gradient } = getCategoryStyle(course.category)
  const icon = getCategoryIcon(course.category)

  // sm: ảnh nhỏ (bảng khóa học của giảng viên) → chữ không đọc được, chỉ vẽ nền + icon danh mục
  if (size === 'sm') {
    return (
      <div className={cn('flex aspect-video items-center justify-center bg-linear-to-br', gradient, className)}>
        <Image src={icon} alt='' width={20} height={20} className='size-5' />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative flex aspect-video flex-col justify-center overflow-hidden bg-linear-to-br text-black',
        gradient,
        size === 'lg' ? 'gap-4 p-8' : 'gap-3 p-6',
        className
      )}
    >
      {/* Icon danh mục lớn, mờ ở góc phải: họa tiết thay cho ảnh minh hoạ */}
      <Image
        src={icon}
        alt=''
        width={160}
        height={160}
        aria-hidden
        className='absolute -right-6 -bottom-8 size-40 -rotate-12 opacity-15'
      />
      <Image src={icon} alt='' width={32} height={32} className={size === 'lg' ? 'size-10' : 'size-8'} />
      <p
        className={cn(
          'relative line-clamp-2 font-heading leading-[1.2] font-semibold',
          size === 'lg' ? 'text-3xl md:text-4xl' : 'text-xl'
        )}
      >
        {course.title}
      </p>
      {course.subtitle && size === 'lg' && (
        <p className='relative line-clamp-1 text-[#555] md:text-lg'>{course.subtitle}</p>
      )}
    </div>
  )
}
