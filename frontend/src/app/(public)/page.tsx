import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

// Trang chủ tạm thời: sau này thêm danh sách khóa học nổi bật (GET /courses?sort=popular)
export default function HomePage() {
  return (
    <section className='flex flex-1 flex-col items-center justify-center gap-6 py-16 text-center'>
      <span className='rounded-full border px-3 py-1 text-xs text-muted-foreground'>Học trực tuyến cùng giảng viên</span>
      <h1 className='max-w-2xl text-4xl font-bold tracking-tight md:text-5xl'>
        Nâng cấp kỹ năng của bạn với <span className='text-primary'>EduPlatform</span>
      </h1>
      <p className='max-w-xl text-muted-foreground md:text-lg'>
        Lập trình, thiết kế, marketing, khoa học dữ liệu. Học theo tốc độ của bạn, theo dõi tiến độ từng bài.
      </p>
      <div className='flex flex-wrap justify-center gap-3'>
        <Button asChild size='lg'>
          <Link href='/courses'>
            Khám phá khóa học <ArrowRight />
          </Link>
        </Button>
        <Button asChild size='lg' variant='outline'>
          <Link href='/register'>Đăng ký miễn phí</Link>
        </Button>
      </div>
    </section>
  )
}
