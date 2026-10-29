'use client'

import { useAppContext } from '@/components/app-provider'
import { Button } from '@/components/ui/button'
import Waves from '@/components/waves'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

// Khối kêu gọi cuối trang chủ: nền xanh có sóng (cùng phong cách banner đầu trang → mở và đóng trang cùng 1 "giọng").
// Client Component để đổi nút theo trạng thái đăng nhập (token ở localStorage, server không biết):
//   chưa đăng nhập → "Đăng ký miễn phí";  đã đăng nhập → "Khóa học của tôi"
export default function CtaSection() {
  const { isAuth } = useAppContext()

  return (
    <section className='relative overflow-hidden rounded-3xl bg-linear-to-br from-sky-400 via-sky-500 to-blue-600 px-6 pt-12 pb-20 text-center text-white md:px-12 dark:from-sky-600 dark:via-sky-700 dark:to-blue-800'>
      <div aria-hidden className='absolute -top-24 -left-24 size-80 rounded-full bg-white/20 blur-3xl' />
      <Waves className='h-1/3' animated />

      <div className='relative mx-auto flex max-w-2xl flex-col items-center gap-4'>
        <h2 className='text-3xl leading-tight font-bold text-balance md:text-4xl'>Sẵn sàng bắt đầu hành trình học?</h2>
        <p className='text-white/90 md:text-lg'>
          Nhiều khóa học miễn phí và có phí đang chờ bạn. Học theo tốc độ của mình, theo dõi tiến độ từng bài.
        </p>
        <div className='mt-2 flex flex-wrap justify-center gap-3'>
          <Button asChild size='lg' className='rounded-full bg-white px-6 text-sky-700 hover:bg-white/90'>
            {isAuth ? <Link href='/my-courses'>Khóa học của tôi</Link> : <Link href='/register'>Đăng ký miễn phí</Link>}
          </Button>
          <Button
            asChild
            size='lg'
            variant='outline'
            className='rounded-full border-white/70 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white'
          >
            <Link href='/courses'>
              Khám phá khóa học <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
