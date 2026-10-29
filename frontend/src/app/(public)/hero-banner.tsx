import courseApiRequest from '@/apiRequests/course'
import FullBleed from '@/components/full-bleed'
import { Skeleton } from '@/components/ui/skeleton'
import Waves, { WavyUnderline } from '@/components/waves'
import { ArrowRight, Search, Star, Users } from 'lucide-react'
import Form from 'next/form'
import Link from 'next/link'
import { Suspense } from 'react'
import CourseCard from './courses/course-card'

// Lối tắt dưới ô tìm kiếm: bộ lọc có sẵn của trang /courses
const quickLinks = [
  { label: 'Khóa miễn phí', href: '/courses?price=free' },
  { label: 'Học nhiều nhất', href: '/courses?sort=popular' },
  { label: 'Mới ra mắt', href: '/courses?sort=newest' }
]

// Banner đầu trang chủ, TRÀN HẾT chiều ngang, nền sáng (xanh biển rất nhạt + vầng màu mờ), đáy là sóng cong.
//   Trái: tiêu đề lớn chữ đậm, 1 cụm chữ tô gradient + gạch sóng san hô, mô tả, ô tìm kiếm, lối tắt
//   Phải: thẻ khóa học THẬT đông học viên nhất đang "nổi", kèm 2 nhãn số liệu thật của khóa đó
// -mt-6 / md:-mt-8: bù padding trên của <main> → banner dính sát header.
// Chữ + ô tìm kiếm hiện ngay (không chờ API); riêng thẻ khóa học nằm trong Suspense
export default function HeroBanner() {
  return (
    <FullBleed
      className='-mt-6 bg-linear-to-br from-sky-50 via-white to-blue-100/70 md:-mt-8 dark:from-slate-900 dark:via-slate-950 dark:to-sky-950'
      innerClassName='grid items-center gap-12 pt-14 pb-36 md:pt-20 md:pb-44 lg:grid-cols-[1.1fr_1fr]'
      decoration={
        <>
          {/* Các vầng màu mờ: nền có chiều sâu mà không rối */}
          <div aria-hidden className='absolute -top-32 -left-24 size-[28rem] rounded-full bg-sky-300/30 blur-3xl' />
          <div
            aria-hidden
            className='absolute top-1/3 right-[-6rem] size-[26rem] rounded-full bg-blue-300/25 blur-3xl'
          />
          <div aria-hidden className='absolute bottom-24 left-1/3 size-64 rounded-full bg-orange-200/30 blur-3xl' />
          {/* Sóng cùng màu nền trang → đáy banner cong mềm, "chảy" vào phần bên dưới */}
          <Waves className='h-28 [&_path]:fill-background' animated />
        </>
      }
    >
      <div className='flex flex-col items-start gap-6'>
        <span className='flex items-center gap-2 rounded-full border bg-card/80 px-3.5 py-1.5 text-sm font-medium shadow-sm backdrop-blur'>
          <span aria-hidden className='size-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px] shadow-emerald-500/20' />
          Nền tảng học trực tuyến cho người Việt
        </span>
        <h2 className='text-4xl leading-[1.15] font-bold tracking-tight md:text-6xl'>
          Học từng bước,
          <br />
          {/* Cụm chữ nhấn: chữ tô gradient xanh + gạch sóng màu san hô bên dưới */}
          <span className='relative inline-block bg-linear-to-r from-sky-500 to-blue-700 bg-clip-text text-transparent'>
            tiến xa
            <WavyUnderline className='absolute -bottom-2 left-0 text-highlight' />
          </span>{' '}
          mỗi ngày
        </h2>
        <p className='max-w-xl text-lg text-muted-foreground'>
          Lập trình, thiết kế, marketing, khoa học dữ liệu. Học theo tốc độ của bạn, theo dõi tiến độ từng bài, nhận
          đánh giá thật từ học viên đã học.
        </p>

        <Form
          action='/courses'
          role='search'
          className='flex w-full max-w-xl items-center gap-2 rounded-full border bg-card p-1.5 shadow-xl shadow-sky-900/10'
        >
          <Search className='ml-3 size-5 shrink-0 text-muted-foreground' />
          <input
            name='search'
            type='search'
            placeholder='Bạn muốn học gì hôm nay?'
            aria-label='Tìm khóa học'
            className='h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground'
          />
          <button
            type='submit'
            className='h-11 shrink-0 rounded-full bg-linear-to-r from-sky-500 to-blue-600 px-6 text-sm font-semibold text-white shadow-md shadow-sky-500/30 transition-opacity hover:opacity-90'
          >
            Tìm kiếm
          </button>
        </Form>

        <div className='flex flex-wrap items-center gap-2 text-sm'>
          <span className='text-muted-foreground'>Gợi ý:</span>
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className='flex items-center gap-1 rounded-full border bg-card/70 px-3 py-1 transition-colors hover:border-primary/40 hover:text-primary'
            >
              {link.label} <ArrowRight className='size-3.5' />
            </Link>
          ))}
        </div>
      </div>

      {/* Bên phải (máy tính): thẻ khóa học thật đang nổi */}
      <div className='relative mx-auto hidden w-full max-w-sm lg:block'>
        {/* Vòng tròn gradient sau thẻ: tạo tiêu điểm cho cột phải */}
        <div
          aria-hidden
          className='absolute top-1/2 left-1/2 size-[26rem] -translate-1/2 rounded-full bg-linear-to-br from-sky-300/60 via-sky-400/40 to-blue-500/50'
        />
        <div
          aria-hidden
          className='absolute top-1/2 left-1/2 size-[32rem] -translate-1/2 rounded-full border border-sky-400/30'
        />
        <Suspense fallback={<Skeleton className='relative h-[30rem] w-full rounded-3xl' />}>
          <HeroCourse />
        </Suspense>
      </div>
    </FullBleed>
  )
}

// Khóa đông học viên nhất (lấy từ API, không bịa) + 2 nhãn số liệu của chính khóa đó.
// 2 nhãn đặt phần lớn RA NGOÀI mép thẻ (-left-32 / -right-28): không đè lên chữ trong ảnh bìa và nội dung thẻ
// Lỗi API / chưa có khóa nào → không hiện gì (cột phải chỉ còn vòng tròn trang trí)
async function HeroCourse() {
  const course = await courseApiRequest
    .list({ sort: 'popular', limit: 1 })
    .then((res) => res.payload.data[0])
    .catch(() => undefined)
  if (!course) return null

  return (
    <div className='relative'>
      <div className='rotate-2 motion-safe:animate-float'>
        <CourseCard course={course} />
      </div>
      {course.rating.totalReviews > 0 && (
        <span className='absolute top-1/3 -left-32 flex items-center gap-2 rounded-2xl border bg-card px-3.5 py-2.5 text-sm shadow-xl motion-safe:animate-float motion-safe:[animation-delay:-2s]'>
          <span className='flex size-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/15'>
            <Star className='size-4 fill-amber-400 text-amber-400' />
          </span>
          <span className='flex flex-col leading-tight'>
            <span className='font-semibold'>{course.rating.averageRating}/5</span>
            <span className='text-xs text-muted-foreground'>{course.rating.totalReviews} đánh giá</span>
          </span>
        </span>
      )}
      <span className='absolute -right-28 bottom-16 flex items-center gap-2 rounded-2xl border bg-card px-3.5 py-2.5 text-sm shadow-xl motion-safe:animate-float motion-safe:[animation-delay:-4s]'>
        <span className='flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary'>
          <Users className='size-4' />
        </span>
        <span className='flex flex-col leading-tight'>
          <span className='font-semibold'>{course.studentCount} học viên</span>
          <span className='text-xs text-muted-foreground'>đang theo học</span>
        </span>
      </span>
    </div>
  )
}
