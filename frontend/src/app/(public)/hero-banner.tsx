import Waves, { WavyUnderline } from '@/components/waves'
import { ArrowRight, CheckCircle2, PlayCircle, Search, Star } from 'lucide-react'
import Form from 'next/form'
import Link from 'next/link'

// Lối tắt dưới ô tìm kiếm: bộ lọc có sẵn của trang /courses
const quickLinks = [
  { label: 'Khóa miễn phí', href: '/courses?price=free' },
  { label: 'Học nhiều nhất', href: '/courses?sort=popular' },
  { label: 'Mới ra mắt', href: '/courses?sort=newest' }
]

// Banner đầu trang chủ: 1 khối tĩnh màu xanh biển (không chuyển slide) với họa tiết sóng ở đáy.
// Server Component: không có state; ô tìm kiếm là <Form> GET của Next → /courses?search=...
export default function HeroBanner() {
  return (
    <section className='relative overflow-hidden rounded-3xl bg-linear-to-br from-sky-400 via-sky-500 to-blue-600 text-white dark:from-sky-600 dark:via-sky-700 dark:to-blue-800'>
      {/* Vầng sáng mờ góc phải (như nắng trên mặt biển) + sóng dưới đáy */}
      <div aria-hidden className='absolute -top-24 -right-24 size-96 rounded-full bg-white/20 blur-3xl' />
      <Waves className='h-1/4' />

      <div className='relative flex items-center justify-between gap-10 px-6 pt-10 pb-16 md:px-12 md:pt-14 md:pb-20'>
        <div className='flex max-w-xl flex-col items-start gap-5'>
          <span className='rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm'>
            Nền tảng học trực tuyến
          </span>
          <h2 className='text-3xl leading-tight font-bold md:text-5xl'>
            Học từng bước,{' '}
            {/* Gạch sóng màu san hô dưới cụm chữ: điểm nhấn ấm trên nền xanh */}
            <span className='relative inline-block whitespace-nowrap'>
              tiến xa mỗi ngày
              <WavyUnderline className='absolute -bottom-2 left-0 text-orange-300' />
            </span>
          </h2>
          <p className='text-white/90 md:text-lg'>
            Lập trình, thiết kế, marketing, khoa học dữ liệu. Học theo tốc độ của bạn, theo dõi tiến độ từng bài.
          </p>

          <Form action='/courses' role='search' className='flex w-full max-w-lg items-center gap-2 rounded-full bg-white p-1.5 shadow-lg shadow-blue-900/20'>
            {/* Ô này và thẻ minh họa bên phải LUÔN nền trắng (cả khi bật giao diện tối) → chữ dùng màu cố định
                slate-..., không dùng text-foreground (giao diện tối nó là màu sáng → chữ trắng trên nền trắng) */}
            <Search className='ml-3 size-5 shrink-0 text-slate-500' />
            <input
              name='search'
              type='search'
              placeholder='Bạn muốn học gì hôm nay?'
              aria-label='Tìm khóa học'
              className='h-10 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500'
            />
            <button
              type='submit'
              className='h-10 shrink-0 rounded-full bg-highlight px-5 text-sm font-semibold text-highlight-foreground transition-opacity hover:opacity-90'
            >
              Tìm kiếm
            </button>
          </Form>

          <div className='flex flex-wrap gap-2'>
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className='flex items-center gap-1 rounded-full border border-white/40 px-3 py-1 text-sm transition-colors hover:bg-white hover:text-sky-700'
              >
                {link.label} <ArrowRight className='size-3.5' />
              </Link>
            ))}
          </div>
        </div>

        {/* Minh họa bên phải (chỉ máy tính, chỉ để trang trí): thẻ "đang học" có thanh tiến độ
            + 2 nhãn nổi xung quanh → nói lên điểm mạnh của nền tảng: học có lộ trình, theo dõi tiến độ */}
        <div aria-hidden className='relative hidden w-80 shrink-0 lg:block'>
          <div className='rotate-2 rounded-2xl bg-white p-4 text-slate-900 shadow-2xl shadow-blue-900/30'>
            <div className='relative flex aspect-video items-end overflow-hidden rounded-xl bg-linear-to-br from-sky-400 to-blue-700 p-3'>
              <Waves />
              <PlayCircle className='absolute top-1/2 left-1/2 size-12 -translate-1/2 text-white/90' />
            </div>
            <p className='mt-3 text-xs text-slate-500'>Bài 12 / 18</p>
            <p className='font-heading font-semibold'>Hooks nâng cao trong React</p>
            <div className='mt-3 flex items-center gap-3'>
              <div className='h-2 flex-1 overflow-hidden rounded-full bg-slate-200'>
                <div className='h-full w-2/3 rounded-full bg-sky-500' />
              </div>
              <span className='text-xs font-semibold text-sky-600'>67%</span>
            </div>
          </div>
          <span className='absolute -top-5 -left-8 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-lg'>
            <CheckCircle2 className='size-4 text-emerald-500' /> Hoàn thành bài 11
          </span>
          <span className='absolute -bottom-6 -left-4 flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-lg'>
            <Star className='size-4 fill-amber-400 text-amber-400' /> 4.8 · 120 đánh giá
          </span>
        </div>
      </div>
    </section>
  )
}
