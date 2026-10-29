'use client'

import { useAppContext } from '@/components/app-provider'
import FullBleed from '@/components/full-bleed'
import { Button } from '@/components/ui/button'
import Waves from '@/components/waves'
import { ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

// Khối kêu gọi cuối trang chủ: dải xanh TRÀN NGANG có sóng, cùng phong cách banner đầu trang
// → trang mở và đóng bằng cùng 1 "giọng" màu thương hiệu.
// Client Component để đổi nút theo trạng thái đăng nhập (token ở localStorage, server không biết):
//   chưa đăng nhập → "Đăng ký miễn phí";  đã đăng nhập → "Khóa học của tôi"
export default function CtaSection() {
  const t = useTranslations('Cta')
  const { isAuth } = useAppContext()

  return (
    <FullBleed
      // -mb: bù đúng pb của <main> (layout) → dải nối liền footer, không có khoảng trắng ở giữa
      className='-mb-16 bg-linear-to-br from-sky-400 via-sky-500 to-blue-600 py-16 text-white md:-mb-20 md:py-20 dark:from-sky-600 dark:via-sky-700 dark:to-blue-800'
      innerClassName='flex flex-col items-center gap-4 pb-8 text-center'
      decoration={
        <>
          <div aria-hidden className='absolute -top-24 left-[10%] size-80 rounded-full bg-white/20 blur-3xl' />
          <Waves className='h-1/3' animated />
        </>
      }
    >
      <h2 className='max-w-2xl text-3xl leading-tight font-bold text-balance md:text-4xl'>{t('title')}</h2>
      <p className='max-w-2xl text-white/90 md:text-lg'>{t('description')}</p>
      <div className='mt-2 flex flex-wrap justify-center gap-3'>
        <Button asChild size='lg' className='rounded-full bg-white px-6 text-sky-700 hover:bg-white/90'>
          {isAuth ? <Link href='/my-courses'>{t('myCourses')}</Link> : <Link href='/register'>{t('register')}</Link>}
        </Button>
        <Button
          asChild
          size='lg'
          variant='outline'
          className='rounded-full border-white/70 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white'
        >
          <Link href='/courses'>
            {t('explore')} <ArrowRight />
          </Link>
        </Button>
      </div>
    </FullBleed>
  )
}
