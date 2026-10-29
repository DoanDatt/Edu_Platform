import { LogoMark } from '@/components/logo'
import PageBanner from '@/components/page-banner'
import SectionHeading from '@/components/section-heading'
import { Button } from '@/components/ui/button'
import Waves from '@/components/waves'
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
import { features } from '../about-section'
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

  return (
    <div className='flex flex-col gap-20'>
      <div className='flex flex-col'>
        <PageBanner
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
          className='pb-24 md:pb-28'
        />
        {/* Số liệu thật chồng lên đáy banner, giống trang chủ */}
        <div className='relative z-10 -mt-14 px-4 md:px-8'>
          <Suspense fallback={<StatsStripSkeleton />}>
            <StatsStrip />
          </Suspense>
        </div>
      </div>

      <section id='cau-chuyen' className='grid scroll-mt-32 items-center gap-12 lg:grid-cols-[1.1fr_1fr]'>
        <div className='flex flex-col gap-5'>
          <SectionHeading align='left' eyebrow={t('storyEyebrow')} title={t('storyTitle')} />
          <p className='leading-relaxed text-muted-foreground'>{t('storyParagraph1')}</p>
          <p className='leading-relaxed text-muted-foreground'>{t('storyParagraph2')}</p>
        </div>
        <div className='grid gap-4'>
          {values.map(({ Icon, key }) => (
            <div key={key} className='flex gap-4 rounded-2xl border bg-card p-5 shadow-sm'>
              <span className='flex size-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-sky-400 to-blue-600 text-white shadow-md shadow-sky-500/25'>
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
              className='flex flex-col gap-4 rounded-3xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10'
            >
              <span className='flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                <Icon className='size-6' />
              </span>
              <h3 className='font-heading text-lg font-semibold'>{tFeature(`${key}.title`)}</h3>
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
              <span className='relative flex size-16 items-center justify-center rounded-full border-4 border-background bg-linear-to-br from-sky-400 to-blue-600 text-white shadow-lg shadow-sky-500/30'>
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
        className='relative grid scroll-mt-32 items-center gap-8 overflow-hidden rounded-3xl bg-linear-to-br from-sky-500 via-sky-600 to-blue-800 p-8 text-white md:p-12 lg:grid-cols-[1fr_auto]'
      >
        <div aria-hidden className='absolute -top-20 -right-10 size-72 rounded-full bg-white/15 blur-3xl' />
        <Waves className='h-1/3' animated />
        <div className='relative flex flex-col gap-4'>
          <span className='text-xs font-semibold tracking-widest text-white/80 uppercase'>
            {t('instructorEyebrow')}
          </span>
          <h2 className='max-w-xl text-3xl leading-tight font-bold text-balance'>{t('instructorTitle')}</h2>
          <ul className='grid gap-2 text-white/90 sm:grid-cols-2'>
            {instructorPoints.map((key) => (
              <li key={key} className='flex items-center gap-2'>
                <CheckCircle2 className='size-4 shrink-0' /> {t(`instructorPoints.${key}`)}
              </li>
            ))}
          </ul>
          <p className='text-sm text-white/75'>{t('instructorNote')}</p>
        </div>
        <div className='relative flex flex-col items-start gap-4 lg:items-center'>
          <LogoMark className='hidden size-24 rounded-[1.75rem] bg-none bg-white/15 shadow-none lg:flex [&_svg]:size-14' />
          <Button asChild size='lg' className='rounded-full bg-white px-6 text-sky-700 hover:bg-white/90'>
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
              className='group rounded-2xl border bg-card px-5 shadow-sm transition-colors open:border-primary/30'
            >
              <summary className='flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold [&::-webkit-details-marker]:hidden'>
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
