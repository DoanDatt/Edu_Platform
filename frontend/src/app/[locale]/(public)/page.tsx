import { useTranslations } from 'next-intl'
import { Suspense } from 'react'
import AboutSection from './about-section'
import CategorySection, { CategorySectionSkeleton } from './category-section'
import CourseSection, { CourseSectionSkeleton } from './course-section'
import CtaSection from './cta-section'
import HeroBanner from './hero-banner'
import StatsStrip, { StatsStripSkeleton } from './stats-strip'
import TestimonialMarquee, { TestimonialMarqueeSkeleton } from './testimonial-marquee'

// Trang chủ. Khối tĩnh (banner, giới thiệu, kêu gọi) hiện ngay; mỗi khối gọi API nằm trong <Suspense> RIÊNG:
// khối nào tải xong hiện khối đó, không khối nào phải chờ khối khác.
// Nhịp nền khi cuộn: banner sáng → cảm nhận chạy ngang → danh mục (trắng) → khóa nổi bật (nền xanh nhạt tràn ngang)
// → giới thiệu (trắng) → khóa miễn phí (nền xanh nhạt) → kêu gọi (dải xanh đậm nối liền footer)
export default function HomePage() {
  const t = useTranslations('Home')

  return (
    <div className='flex flex-col gap-20'>
      {/* h1 cho SEO / trình đọc màn hình: tiêu đề banner là h2, trang vẫn cần đúng 1 h1 */}
      <h1 className='sr-only'>{t('h1')}</h1>
      <div className='flex flex-col'>
        <HeroBanner />
        {/* Dải số liệu chồng lên đáy cong của banner (margin âm + z-10): 2 khối liền một mạch */}
        <div className='relative z-10 -mt-24 md:-mt-28'>
          <Suspense fallback={<StatsStripSkeleton />}>
            <StatsStrip />
          </Suspense>
        </div>
      </div>

      {/* Lời nhận xét của học viên chạy ngang ngay dưới banner: người mới vào thấy "web có người học thật" trước tiên */}
      <Suspense fallback={<TestimonialMarqueeSkeleton />}>
        <TestimonialMarquee />
      </Suspense>

      <Suspense fallback={<CategorySectionSkeleton />}>
        <CategorySection />
      </Suspense>

      {/* Cùng 1 component, khác query → 2 khối khác nhau. tinted: nền xanh nhạt tràn ngang.
          -my-10: khối nền màu đã có padding trong → bù bớt khoảng cách gap của trang cho đều */}
      <div className='-my-10'>
        <Suspense fallback={<CourseSectionSkeleton count={8} />}>
          <CourseSection
            tinted
            eyebrow={t('popularEyebrow')}
            title={t('popularTitle')}
            description={t('popularDescription')}
            query={{ sort: 'popular', limit: 8 }}
            href='/courses?sort=popular'
          />
        </Suspense>
      </div>

      <AboutSection />

      <div className='-my-10'>
        <Suspense fallback={<CourseSectionSkeleton count={4} />}>
          <CourseSection
            tinted
            eyebrow={t('freeEyebrow')}
            title={t('freeTitle')}
            description={t('freeDescription')}
            query={{ price: 'free', limit: 4 }}
            href='/courses?price=free'
          />
        </Suspense>
      </div>

      <CtaSection />
    </div>
  )
}
