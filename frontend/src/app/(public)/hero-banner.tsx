'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowRight, BookOpen, ChartLine, Code, LucideIcon, PlayCircle, Presentation, Sparkles, Users } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type Slide = {
  badge: string
  title: string
  highlight: string // phần tiêu đề tô màu vàng
  description: string
  cta: { label: string; href: string }
  gradient: string
  icons: LucideIcon[] // 3 icon trang trí bên phải
}

const slides: Slide[] = [
  {
    badge: 'Học trực tuyến',
    title: 'Nâng cấp kỹ năng cùng',
    highlight: 'EduPlatform',
    description: 'Lập trình, thiết kế, marketing, khoa học dữ liệu. Học theo tốc độ của bạn, theo dõi tiến độ từng bài.',
    cta: { label: 'Khám phá khóa học', href: '/courses' },
    gradient: 'from-sky-500 via-blue-600 to-indigo-700',
    icons: [Code, PlayCircle, BookOpen]
  },
  {
    badge: 'Miễn phí',
    title: 'Bắt đầu với',
    highlight: 'khóa học miễn phí',
    description: 'Nhiều khóa học miễn phí cho người mới bắt đầu. Đăng ký tài khoản là học được ngay.',
    cta: { label: 'Xem khóa miễn phí', href: '/courses?price=free' },
    gradient: 'from-orange-400 via-orange-500 to-rose-600',
    icons: [Sparkles, PlayCircle, ChartLine]
  },
  {
    badge: 'Giảng viên',
    title: 'Chia sẻ kiến thức,',
    highlight: 'mở lớp của riêng bạn',
    description: 'Tạo khóa học, tải video bài giảng, theo dõi học viên và đánh giá ngay trên nền tảng.',
    cta: { label: 'Xem các khóa nổi bật', href: '/courses?sort=popular' },
    gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
    icons: [Presentation, Users, ChartLine]
  }
]

const INTERVAL_MS = 6000

// Banner chuyển slide ở đầu trang chủ. Tất cả slide CHỒNG lên nhau trong 1 ô grid,
// slide đang chọn opacity 100, còn lại opacity 0 → chuyển slide là hiệu ứng mờ dần (fade)
export default function HeroBanner() {
  const [current, setCurrent] = useState(0)
  // Rê chuột vào banner thì dừng tự chuyển (người dùng đang đọc)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const timer = setInterval(() => setCurrent((index) => (index + 1) % slides.length), INTERVAL_MS)
    // Dọn timer khi paused đổi / rời trang: không thì timer cũ vẫn chạy song song timer mới
    return () => clearInterval(timer)
  }, [paused])

  return (
    <section
      aria-roledescription='carousel'
      aria-label='Giới thiệu'
      className='relative overflow-hidden rounded-3xl'
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className='grid'>
        {slides.map((slide, index) => {
          const isActive = index === current
          return (
            <div
              key={slide.title}
              aria-hidden={!isActive}
              // inert: slide đang ẩn thì không bấm / Tab vào link bên trong được
              inert={!isActive}
              className={cn(
                'relative col-start-1 row-start-1 flex items-center bg-linear-to-r text-white transition-opacity duration-700',
                slide.gradient,
                isActive ? 'opacity-100' : 'opacity-0'
              )}
            >
              {/* Sọc chéo mờ giống ảnh bìa khóa học */}
              <div
                aria-hidden
                className='absolute inset-0 bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.06)_0_2px,transparent_2px_18px)]'
              />
              <div className='relative flex w-full items-center justify-between gap-8 px-6 py-10 md:px-12 md:py-14'>
                <div className='flex max-w-xl flex-col items-start gap-4'>
                  <span className='rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm'>
                    {slide.badge}
                  </span>
                  <h2 className='text-3xl font-bold leading-tight tracking-tight md:text-4xl'>
                    {slide.title} <span className='text-yellow-300'>{slide.highlight}</span>
                  </h2>
                  <p className='text-white/90 md:text-lg'>{slide.description}</p>
                  <Button
                    asChild
                    size='lg'
                    variant='outline'
                    className='mt-2 rounded-full border-white/70 bg-transparent px-5 text-white hover:bg-white hover:text-foreground'
                  >
                    <Link href={slide.cta.href}>
                      {slide.cta.label} <ArrowRight />
                    </Link>
                  </Button>
                </div>
                {/* Trang trí bên phải (ẩn trên điện thoại): 3 ô kính mờ chứa icon, xếp lệch nhau */}
                <div aria-hidden className='relative hidden size-56 shrink-0 lg:block'>
                  {slide.icons.map((Icon, iconIndex) => (
                    <span
                      key={iconIndex}
                      className={cn(
                        'absolute flex items-center justify-center rounded-3xl bg-white/15 shadow-lg ring-1 ring-white/30 backdrop-blur-md',
                        iconIndex === 0 && 'top-0 left-6 size-28',
                        iconIndex === 1 && 'top-16 right-0 size-24',
                        iconIndex === 2 && 'bottom-0 left-0 size-20'
                      )}
                    >
                      <Icon className={iconIndex === 0 ? 'size-12' : 'size-9'} />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Chấm chọn slide */}
      <div className='absolute bottom-4 left-6 flex gap-2 md:left-12'>
        {slides.map((slide, index) => (
          <button
            key={slide.title}
            type='button'
            aria-label={`Slide ${index + 1}`}
            aria-current={index === current}
            onClick={() => setCurrent(index)}
            className={cn(
              'h-2 rounded-full bg-white transition-all',
              index === current ? 'w-6 opacity-100' : 'w-2 opacity-50 hover:opacity-80'
            )}
          />
        ))}
      </div>
    </section>
  )
}
