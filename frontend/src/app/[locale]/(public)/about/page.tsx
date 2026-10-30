import { LogoMark } from '@/components/logo'
import PageBanner from '@/components/page-banner'
import SectionHeading from '@/components/section-heading'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Compass,
  CreditCard,
  Eye,
  Heart,
  LucideIcon,
  MessageSquareText,
  PlayCircle,
  Target,
  UserPlus
} from 'lucide-react'
import type { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import { features } from './features'
import CtaSection from '../cta-section'
import StatsStrip, { StatsStripSkeleton } from '../stats-strip'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('About')
  return { title: t('metaTitle'), description: t('metaDescription') }
}

// Chữ nằm ở messages/*.json, namespace "About". Dữ liệu dưới đây chỉ ghi icon + khóa dịch
const values = [
  { Icon: Target, key: 'mission' },
  { Icon: Eye, key: 'vision' },
  { Icon: Heart, key: 'values' }
] as const satisfies { Icon: LucideIcon; key: string }[]

// Các bước học trên nền tảng: đúng luồng web đang chạy (đăng ký → mua → học → đánh giá)
const steps = [
  { Icon: UserPlus, key: 'signUp' },
  { Icon: CreditCard, key: 'buy' },
  { Icon: PlayCircle, key: 'learn' },
  { Icon: MessageSquareText, key: 'review' }
] as const satisfies { Icon: LucideIcon; key: string }[]

const instructorPoints = ['createCourse', 'uploadVideo', 'submitReview', 'trackRevenue'] as const

const faqs = ['access', 'payment', 'transferPending', 'completion', 'becomeInstructor'] as const

// Trang Giới thiệu (About us). Mỗi khối có id để menu "Giới thiệu" nhảy thẳng tới.
// scroll-mt: chừa chỗ cho header dính 2 tầng, không thì tiêu đề khối bị header che mất
export default function AboutPage() {
  const t = useTranslations('About')
  const tFeature = useTranslations('Features')
  const tNav = useTranslations('Nav')

  return (
    <div className='flex flex-col gap-16 lg:gap-[90px]'>
      <div className='flex flex-col gap-10'>
        <PageBanner title={t('title')} description={t('description')} breadcrumbLabel={tNav('about')} />
        {/* Số liệu thật: cùng 4 ô như trang chủ */}
        <Suspense fallback={<StatsStripSkeleton />}>
          <StatsStrip />
        </Suspense>
      </div>

      <section id='cau-chuyen' className='grid scroll-mt-32 items-center gap-12 lg:grid-cols-[1.1fr_1fr]'>
        <div className='flex flex-col gap-5'>
          <SectionHeading align='left' eyebrow={t('storyEyebrow')} title={t('storyTitle')} />
          <p className='leading-relaxed text-muted-foreground'>{t('storyParagraph1')}</p>
          <p className='leading-relaxed text-muted-foreground'>{t('storyParagraph2')}</p>
        </div>
        <div className='grid gap-4'>
          {values.map(({ Icon, key }) => (
            <div key={key} className='flex gap-4 rounded-[20px] border bg-card p-5'>
              <span className='flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                <Icon className='size-6' />
              </span>
              <div className='flex flex-col gap-1'>
                <h3 className='font-heading text-lg font-semibold'>{t(`valueItems.${key}.title`)}</h3>
                <p className='text-sm leading-relaxed text-muted-foreground'>{t(`valueItems.${key}.description`)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id='diem-noi-bat' className='flex scroll-mt-32 flex-col gap-10'>
        <SectionHeading
          eyebrow={t('highlightsEyebrow')}
          title={t('highlightsTitle')}
          description={t('highlightsDescription')}
        />
        <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-4'>
          {features.map(({ Icon, key }) => (
            <div
              key={key}
              className='group flex flex-col gap-4 rounded-[20px] border bg-card p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_4px_10px_rgba(0,0,0,0.1)]'
            >
              <span className='flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                <Icon className='size-6' />
              </span>
              <h3 className='text-xl leading-[1.2] transition-colors group-hover:text-primary'>
                {tFeature(`${key}.title`)}
              </h3>
              <p className='text-sm leading-relaxed text-muted-foreground'>{tFeature(`${key}.description`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section id='cach-hoc' className='flex scroll-mt-32 flex-col gap-10'>
        <SectionHeading eyebrow={t('stepsEyebrow')} title={t('stepsTitle')} />
        {/* Đường nối giữa các bước (chỉ ở màn rộng, các bước nằm cùng hàng) */}
        <ol className='relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4'>
          <div
            aria-hidden
            className='absolute top-8 right-[12.5%] left-[12.5%] hidden border-t-2 border-dashed border-primary/30 lg:block'
          />
          {steps.map(({ Icon, key }, index) => (
            <li key={key} className='relative flex flex-col items-center gap-3 text-center'>
              <span className='relative flex size-16 items-center justify-center rounded-full border-4 border-background bg-primary text-white'>
                <Icon className='size-7' />
                <span className='absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-highlight text-xs font-bold text-white'>
                  {index + 1}
                </span>
              </span>
              <h3 className='mt-1 font-heading text-lg font-semibold'>{t(`stepItems.${key}.title`)}</h3>
              <p className='max-w-64 text-sm leading-relaxed text-muted-foreground'>
                {t(`stepItems.${key}.description`)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section
        id='giang-vien'
        className='grid scroll-mt-32 items-center gap-8 rounded-[20px] bg-secondary p-8 md:p-12 lg:grid-cols-[1fr_auto]'
      >
        {/* Khối kêu gọi kiểu banner EduPress: nền xám nhạt, nhãn in hoa, tiêu đề 32px, nút cam */}
        <div className='flex flex-col gap-4'>
          <span className='font-heading text-base leading-[1.2] font-semibold text-muted-foreground uppercase'>
            {t('instructorEyebrow')}
          </span>
          <h2 className='max-w-xl text-[26px] leading-[1.2] text-balance md:text-[32px]'>{t('instructorTitle')}</h2>
          <ul className='grid gap-2 text-lg sm:grid-cols-2'>
            {instructorPoints.map((key) => (
              <li key={key} className='flex items-center gap-2'>
                <CheckCircle2 className='size-4 shrink-0 text-highlight' /> {t(`instructorPoints.${key}`)}
              </li>
            ))}
          </ul>
          <p className='text-muted-foreground'>{t('instructorNote')}</p>
        </div>
        <div className='flex flex-col items-start gap-4 lg:items-center'>
          <LogoMark className='hidden size-24 rounded-[1.75rem] lg:flex [&_svg]:size-14' />
          <Button asChild size='pill'>
            <Link href='/instructor'>
              {t('instructorCta')} <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      <section id='hoi-dap' className='grid scroll-mt-32 gap-10 lg:grid-cols-[1fr_1.6fr]'>
        <div className='flex flex-col gap-5'>
          <SectionHeading
            align='left'
            eyebrow={t('faqEyebrow')}
            title={t('faqTitle')}
            description={t('faqDescription')}
          />
          <Link href='/blog?category=huong-dan' className='flex w-fit items-center gap-1.5 font-medium text-primary'>
            <Compass className='size-4' /> {t('faqGuides')} <ArrowRight className='size-4' />
          </Link>
        </div>
        {/* <details>: mở / đóng không cần JS, bàn phím dùng được sẵn */}
        <div className='flex flex-col gap-3'>
          {faqs.map((key) => (
            <details
              key={key}
              className='group rounded-[20px] border bg-card px-6 transition-colors open:border-primary'
            >
              <summary className='flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-heading text-lg font-semibold group-open:text-primary [&::-webkit-details-marker]:hidden'>
                {t(`faqItems.${key}.question`)}
                <ChevronDown className='size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 group-open:text-primary' />
              </summary>
              <p className='pb-5 leading-relaxed text-muted-foreground'>{t(`faqItems.${key}.answer`)}</p>
            </details>
          ))}
        </div>
      </section>

      <CtaSection />
    </div>
  )
}
