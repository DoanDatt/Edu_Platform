import { cn } from '@/lib/utils'
import { BookOpen } from 'lucide-react'
import Image from 'next/image'

// Next 16 không tối ưu ảnh từ địa chỉ local (localhost, 127.0.0.1) để chống tấn công mạng nội bộ
// (images.dangerouslyAllowLocalIP = false). Ảnh upload lúc dev nằm ở localhost:4000
// → tắt tối ưu riêng cho các ảnh này. Deploy thật, API có tên miền riêng thì vẫn được tối ưu
const isLocalUrl = (src: string) => {
  try {
    return ['localhost', '127.0.0.1'].includes(new URL(src).hostname)
  } catch {
    return false
  }
}

// Ảnh bìa khóa học tỉ lệ 16:9. Khóa chưa có ảnh → nền màu + icon
export default function CourseThumbnail({
  src,
  alt,
  className,
  sizes = '(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw',
  priority = false
}: {
  src: string | null
  alt: string
  className?: string
  sizes?: string // ảnh hiển thị rộng bao nhiêu so với màn hình → trình duyệt tải đúng cỡ ảnh
  priority?: boolean // ảnh ở đầu trang: tải ngay, không đợi cuộn tới
}) {
  return (
    <div className={cn('relative aspect-video overflow-hidden bg-muted', className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={isLocalUrl(src)}
          className='object-cover'
        />
      ) : (
        <div className='flex h-full items-center justify-center bg-linear-to-br from-primary/20 to-primary/5'>
          <BookOpen className='size-10 text-primary/60' />
        </div>
      )}
    </div>
  )
}
