import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import CategorySection, { CategorySectionSkeleton } from './category-section'
import CourseSection from './course-section'
import { CourseListSkeleton } from './courses/course-list'

// Hero hiện ngay; các khối gọi API nằm trong <Suspense> (cacheComponents), tải xong khối nào hiện khối đó
export default function HomePage() {
  return (
    <div className='flex flex-col gap-16'>
      <section className='flex flex-col items-center gap-6 py-10 text-center md:py-16'>
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

      <Suspense fallback={<CategorySectionSkeleton />}>
        <CategorySection />
      </Suspense>

      <Suspense fallback={<CourseListSkeleton count={8} />}>
        <CourseSection
          title='Khóa học nổi bật'
          description='Được nhiều học viên đăng ký nhất'
          query={{ sort: 'popular', limit: 8 }}
          href='/courses?sort=popular'
        />
      </Suspense>

      <Suspense fallback={<CourseListSkeleton count={4} />}>
        <CourseSection
          title='Khóa học miễn phí'
          description='Bắt đầu học ngay, không tốn đồng nào'
          query={{ price: 'free', limit: 4 }}
          href='/courses?price=free'
        />
      </Suspense>
    </div>
  )
}
