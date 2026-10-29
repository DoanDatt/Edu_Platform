import { LogoMark } from '@/components/logo'
import Waves from '@/components/waves'
import { CheckCircle2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

// Lợi ích hiện ở panel bên trái trang đăng nhập / đăng ký (đều là tính năng web có thật)
const benefits = ['ownPace', 'trackProgress', 'realReviews'] as const

// Khung chung cho trang Đăng nhập / Đăng ký: chia đôi màn hình.
//   Trái (chỉ máy tính, lg+): panel thương hiệu nền xanh có sóng trôi, lời chào + lợi ích
//   Phải: form (children)
// Điện thoại: chỉ còn form, panel trái ẩn đi cho gọn
export default function AuthShell({
  title,
  description,
  children
}: {
  title: string // lời chào lớn ở panel trái
  description: string
  children: React.ReactNode
}) {
  const t = useTranslations('Auth.benefits')

  return (
    <div className='grid flex-1 overflow-hidden rounded-3xl border bg-card shadow-sm lg:grid-cols-2'>
      <aside className='relative hidden flex-col gap-10 overflow-hidden bg-linear-to-br from-sky-400 via-sky-500 to-blue-600 p-10 text-white lg:flex dark:from-sky-600 dark:via-sky-700 dark:to-blue-800'>
        <div aria-hidden className='absolute -top-24 -right-24 size-96 rounded-full bg-white/20 blur-3xl' />
        <Waves className='h-1/4' animated />

        <div className='relative flex items-center gap-2'>
          <LogoMark className='bg-none bg-white/20 shadow-none' />
          <span className='font-heading text-lg font-semibold'>EduPlatform</span>
        </div>
        <div className='relative flex flex-col gap-4'>
          <h2 className='text-3xl leading-tight font-bold text-balance xl:text-4xl'>{title}</h2>
          <p className='text-white/90'>{description}</p>
        </div>
        <ul className='relative flex flex-col gap-3 pb-16'>
          {benefits.map((benefit) => (
            <li key={benefit} className='flex items-start gap-3'>
              <CheckCircle2 className='mt-0.5 size-5 shrink-0 text-white/90' />
              <span className='text-white/90'>{t(benefit)}</span>
            </li>
          ))}
        </ul>
      </aside>

      {/* Nền nhạt để Card của form nổi lên (giữ nguyên form, không phải sửa) */}
      <div className='flex items-center justify-center bg-muted/40 p-6 py-10 md:p-10'>{children}</div>
    </div>
  )
}
