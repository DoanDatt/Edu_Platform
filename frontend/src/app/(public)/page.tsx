import { Suspense } from 'react'
import CategorySection, { CategorySectionSkeleton } from './category-section'
import CourseSection, { CourseSectionSkeleton } from './course-section'
import HeroBanner from './hero-banner'

// Banner hiện ngay (không gọi API). Mỗi khối gọi API nằm trong <Suspense> RIÊNG:
// khối nào tải xong hiện khối đó, không khối nào phải chờ khối khác
export default function HomePage() {
  return (
    <div className='flex flex-col gap-14'>
      {/* h1 cho SEO / trình đọc màn hình: banner dùng h2 cho từng slide, trang vẫn cần đúng 1 h1 */}
      <h1 className='sr-only'>EduPlatform: học lập trình, thiết kế, marketing trực tuyến</h1>
      <HeroBanner />

      <Suspense fallback={<CategorySectionSkeleton />}>
        <CategorySection />
      </Suspense>

      {/* Cùng 1 component, khác query → 2 khối khác nhau */}
      <Suspense fallback={<CourseSectionSkeleton count={8} />}>
        <CourseSection
          title='Khóa học nổi bật'
          description='Được nhiều học viên đăng ký nhất'
          query={{ sort: 'popular', limit: 8 }}
          href='/courses?sort=popular'
        />
      </Suspense>

      <Suspense fallback={<CourseSectionSkeleton count={4} />}>
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
