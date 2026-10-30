import BreadcrumbBar from '@/components/breadcrumb-bar'
import { LogoMark } from '@/components/logo'
import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'

// Lợi ích hiện ở panel bên trái trang đăng nhập / đăng ký (đều là tính năng web có thật)
const benefits = ['ownPace', 'trackProgress', 'realReviews'] as const

// Khung chung cho trang Đăng nhập / Đăng ký / Quên mật khẩu theo phong cách EduPress:
//   dải đường dẫn xám (Trang chủ > Đăng nhập) + khung viền xám bo 20px chia đôi:
//   Trái (chỉ máy tính, lg+): panel nền gradient nhạt như hero, lời chào + lợi ích (dấu ✓ xanh lá)
//   Phải: form (children)
// Điện thoại: chỉ còn form, panel trái ẩn đi cho gọn
export default function AuthShell({
  pageTitle,
  title,
  description,
  children
}: {
  pageTitle: string // tên trang trên dải đường dẫn ("Đăng nhập")
  title: string // lời chào lớn ở panel trái
  description: string
  children: React.ReactNode
}) {
  const t = useTranslations('Auth.benefits')

  return (
    <div className='flex flex-1 flex-col gap-8 md:gap-10'>
      <BreadcrumbBar items={[{ label: pageTitle }]} />

      <div className='grid flex-1 overflow-hidden rounded-[20px] border bg-card lg:grid-cols-2'>
        <aside className='hidden flex-col gap-10 bg-[linear-gradient(110.5deg,#fff5be_0%,#d0f7ea_97.7%)] p-10 lg:flex xl:p-[50px] dark:bg-[linear-gradient(110.5deg,#3a3420_0%,#1d3a33_97.7%)]'>
          <div className='flex items-center gap-2'>
            <LogoMark />
            <span className='font-heading text-xl font-semibold'>EduPlatform</span>
          </div>
          <div className='flex flex-col gap-4'>
            <h2 className='text-[32px] leading-[1.2] text-balance'>{title}</h2>
            <p className='text-lg leading-normal text-muted-foreground'>{description}</p>
          </div>
          <ul className='flex flex-col gap-3'>
            {benefits.map((benefit) => (
              <li key={benefit} className='flex items-start gap-2 text-lg leading-normal'>
                <Check className='mt-1.5 size-4 shrink-0 text-highlight' strokeWidth={2.5} />
                {t(benefit)}
              </li>
            ))}
          </ul>
        </aside>

        <div className='flex items-center justify-center p-6 py-10 md:p-10'>{children}</div>
      </div>
    </div>
  )
}
