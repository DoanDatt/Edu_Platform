import { Skeleton } from '@/components/ui/skeleton'
import { useTranslations } from 'next-intl'
import { Suspense } from 'react'
import CategorySection, { CategorySectionSkeleton } from './category-section'
import CourseSection, { CourseSectionSkeleton } from './course-section'
import CtaSection from './cta-section'
import GrowSkillSection from './grow-skill-section'
import HeroBanner from './hero-banner'
import InstructorBanner from './instructor-banner'
import LatestArticles from './latest-articles'
import PaymentBanner from './payment-banner'
import StatsStrip, { StatsStripSkeleton } from './stats-strip'
import StudentFeedbackSection, { StudentFeedbackSkeleton } from './student-feedback-section'

// Trang chủ theo Figma EduPress ("Home Course Basic", node 1:1255), đúng thứ tự 10 khối, cách nhau 90px:
// Hero → Top Categories → Featured Courses → banner (thanh toán) → số liệu → Grow skill
// → banner (mời làm giảng viên) → Student Feedbacks → CTA → Latest Articles.
// 2 banner của Figma quảng cáo sản phẩm ThimPress → giữ bố cục, thay bằng nội dung thật của EduPlatform.
// Khối tĩnh hiện ngay; mỗi khối gọi API nằm trong <Suspense> RIÊNG: khối nào tải xong hiện khối đó
export default function HomePage() {
  const t = useTranslations('Home')

  return (
    <div className='flex flex-col gap-16 lg:gap-[90px]'>
      {/* Hero chứa h1 của trang */}
      <HeroBanner />

      <Suspense fallback={<CategorySectionSkeleton />}>
        <CategorySection />
      </Suspense>

      <Suspense fallback={<CourseSectionSkeleton count={6} />}>
        <CourseSection
          title={t('featuredTitle')}
          description={t('featuredDescription')}
          query={{ sort: 'popular', limit: 6 }}
          action={{ label: t('allCourses'), href: '/courses?sort=popular' }}
        />
      </Suspense>

      <PaymentBanner />

      <Suspense fallback={<StatsStripSkeleton />}>
        <StatsStrip />
      </Suspense>

      <GrowSkillSection />

      <Suspense fallback={<Skeleton className='h-[300px] rounded-[20px]' />}>
        <InstructorBanner />
      </Suspense>

      <Suspense fallback={<StudentFeedbackSkeleton />}>
        <StudentFeedbackSection />
      </Suspense>

      <CtaSection />

      <LatestArticles />
    </div>
  )
}
