'use client'

import { useAppContext } from '@/components/app-provider'
import { Button } from '@/components/ui/button'
import { GraduationCap } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

// Khối kêu gọi theo bố cục banner CTA của EduPress (node 1:1405): khung bo 20px trong khung 1290px,
// bên trái icon học viên 120px + tiêu đề, bên phải 2 nút (viền + cam).
// Client Component để đổi nút theo trạng thái đăng nhập (token ở localStorage, server không biết):
//   chưa đăng nhập → "Đăng ký miễn phí";  đã đăng nhập → "Khóa học của tôi"
export default function CtaSection() {
  const t = useTranslations('Cta')
  const { isAuth } = useAppContext()

  return (
    <section className='flex flex-col items-start gap-8 rounded-[20px] bg-[linear-gradient(110.5deg,#fff5be_0%,#d0f7ea_97.7%)] px-6 py-10 md:px-[50px] lg:flex-row lg:items-center lg:justify-between lg:py-[65px] dark:bg-[linear-gradient(110.5deg,#3a3420_0%,#1d3a33_97.7%)]'>
      <div className='flex items-center gap-6 md:gap-8'>
        <span className='flex size-20 shrink-0 items-center justify-center rounded-full bg-white/70 text-primary md:size-[120px] dark:bg-black/20'>
          <GraduationCap className='size-10 md:size-16' strokeWidth={1.5} />
        </span>
        <div className='flex max-w-xl flex-col gap-2'>
          <h2 className='text-xl leading-[1.2] md:text-2xl'>{t('title')}</h2>
          <p className='text-lg leading-normal text-muted-foreground'>{t('description')}</p>
        </div>
      </div>
      {/* 2 nút như Figma: "I'm A Student" (viền) + "Become An Instructor" (cam).
          Đã đăng nhập thì nút học viên dẫn tới khóa học của tôi thay vì trang đăng ký */}
      <div className='flex flex-wrap gap-5'>
        <Button asChild variant='bordered' size='pill'>
          <Link href={isAuth ? '/my-courses' : '/register'}>{t('student')}</Link>
        </Button>
        <Button asChild size='pill'>
          <Link href='/about#giang-vien'>{t('instructor')}</Link>
        </Button>
      </div>
    </section>
  )
}
