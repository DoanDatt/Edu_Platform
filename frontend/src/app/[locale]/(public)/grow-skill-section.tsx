import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { Check } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

// Khối "Grow Us Your Skill" theo Figma EduPress (node 1:1362): hình minh hoạ 644 × 469 bên trái,
// chữ 520px bên phải (cách nhau 125px): tiêu đề, mô tả, 4 dòng có dấu ✓ xanh lá, nút cam.
// Figma viết về LearnPress (sản phẩm của ThimPress) → thay bằng điểm mạnh THẬT của EduPlatform
const POINTS = ['watch', 'progress', 'reviews', 'payment'] as const

export default function GrowSkillSection() {
  const t = useTranslations('GrowSkill')

  return (
    <section className='flex flex-col items-center gap-10 lg:flex-row lg:gap-[125px]'>
      <Image
        src='/edupress/home/grow-skill.svg'
        alt=''
        width={644}
        height={469}
        className='h-auto w-full max-w-[644px] shrink-0 dark:opacity-90'
      />
      <div className='flex w-full max-w-[520px] flex-col gap-6'>
        <h2 className='text-[26px] leading-[1.2] capitalize md:text-[32px]'>{t('title')}</h2>
        <div className='flex flex-col gap-5'>
          <div className='flex flex-col gap-4'>
            <p className='text-lg leading-normal text-muted-foreground'>{t('description')}</p>
            <ul className='flex flex-col gap-3'>
              {POINTS.map((key) => (
                <li key={key} className='flex items-center gap-2 text-lg leading-normal'>
                  <Check className='size-4 shrink-0 text-highlight' strokeWidth={2.5} />
                  {t(`points.${key}`)}
                </li>
              ))}
            </ul>
          </div>
          <Button asChild size='pill' className='self-start'>
            <Link href='/courses'>{t('cta')}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
