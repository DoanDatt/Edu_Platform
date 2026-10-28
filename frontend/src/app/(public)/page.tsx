import { Suspense } from 'react'
import CategorySection, { CategorySectionSkeleton } from './category-section'
import CourseSection, { CourseSectionSkeleton } from './course-section'
import FeatureSection from './feature-section'
import HeroBanner from './hero-banner'
import StatsStrip, { StatsStripSkeleton } from './stats-strip'

// Banner + khối "Vì sao chọn" hiện ngay (không gọi API). Mỗi khối gọi API nằm trong <Suspense> RIÊNG:
// khối nào tải xong hiện khối đó, không khối nào phải chờ khối khác.
// Thứ tự có nhịp: banner → số liệu → danh mục → lưới khóa học → khối nền màu → lưới khóa học
export default function HomePage() {
  return (
    <div className='flex flex-col gap-14'>
      {/* h1 cho SEO / trình đọc màn hình: tiêu đề banner là h2, trang vẫn cần đúng 1 h1 */}
      <h1 className='sr-only'>EduPlatform: học lập trình, thiết kế, marketing trực tuyến</h1>
      <div className='flex flex-col gap-4'>
        <HeroBanner />
        <Suspense fallback={<StatsStripSkeleton />}>
          <StatsStrip />
        </Suspense>
      </div>

      <Suspense fallback={<CategorySectionSkeleton />}>
        <CategorySection />
      </Suspense>

      {/* Cùng 1 component, khác query → 2 khối khác nhau */}
      <Suspense fallback={<CourseSectionSkeleton count={8} />}>
        <CourseSection
          eyebrow='Nổi bật'
          title='Khóa học được yêu thích'
          description='Được nhiều học viên đăng ký nhất'
          query={{ sort: 'popular', limit: 8 }}
          href='/courses?sort=popular'
        />
      </Suspense>

      <FeatureSection />

      <Suspense fallback={<CourseSectionSkeleton count={4} />}>
        <CourseSection
          eyebrow='Miễn phí'
          title='Bắt đầu mà không tốn đồng nào'
          description='Đăng ký tài khoản là học được ngay'
          query={{ price: 'free', limit: 4 }}
          href='/courses?price=free'
        />
      </Suspense>
    </div>
  )
}
