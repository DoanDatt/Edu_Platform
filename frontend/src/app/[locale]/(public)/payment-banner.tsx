import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { BadgePercent, CreditCard, Landmark, QrCode, ShieldCheck, Wallet, type LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

// Ô vuông màu xoay nghiêng bên phải banner (vị trí lấy theo bố cục Figma, khung 1290 × 324).
// Figma đặt logo của các hãng (Stripe, WooCommerce...) quảng cáo add-on của ThimPress → thay bằng icon chung
// về thanh toán, KHÔNG vẽ logo hãng nào (MoMo, PayPal... là thương hiệu của họ)
const TILES: { Icon: LucideIcon; className: string }[] = [
  { Icon: Wallet, className: 'left-[44%] top-[26%] size-[128px] rotate-[-12deg] bg-[#8b3ff2]' },
  { Icon: QrCode, className: 'left-[57%] top-[12%] size-[112px] rotate-[10deg] bg-[#5b2ee6]' },
  { Icon: CreditCard, className: 'left-[68%] top-[58%] size-[96px] rotate-[-8deg] bg-[#f5c518]' },
  { Icon: Landmark, className: 'left-[77%] top-[18%] size-[122px] rotate-[14deg] bg-[#2fb5ff]' },
  { Icon: ShieldCheck, className: 'left-[61%] top-[66%] size-[84px] rotate-[18deg] bg-[#35c759]' },
  { Icon: BadgePercent, className: 'left-[88%] top-[46%] size-[132px] rotate-[-14deg] bg-[#ff3b3b]' }
]

// Banner thứ nhất của trang chủ (vị trí banner "LearnPress Add-Ons" trong Figma, node 1:1326):
// khung bo 20px, nền gradient xanh ngọc → hồng, chữ bên trái (nhãn nhỏ, tiêu đề 32px, mô tả, nút cam),
// bên phải các ô màu xoay nghiêng. Nội dung: thanh toán linh hoạt (tính năng có thật của web)
export default function PaymentBanner() {
  const t = useTranslations('PaymentBanner')

  return (
    <section className='relative overflow-hidden rounded-[20px] bg-[linear-gradient(90deg,#b4f5e0_0%,#ffc6c0_100%)] px-6 py-10 md:px-[50px] lg:h-[324px] lg:py-0 dark:bg-[linear-gradient(90deg,#1d3a33_0%,#3d2626_100%)]'>
      <div aria-hidden className='pointer-events-none absolute inset-0 hidden lg:block'>
        {TILES.map(({ Icon, className }, index) => (
          <span
            key={index}
            className={cn(
              'absolute flex items-center justify-center rounded-[28px] text-white shadow-[0_8px_20px_rgba(0,0,0,0.15)]',
              className
            )}
          >
            <Icon className='size-1/2' strokeWidth={1.75} />
          </span>
        ))}
      </div>

      <div className='relative flex h-full max-w-[450px] flex-col justify-center gap-6'>
        <div className='flex flex-col gap-3'>
          <span className='font-heading text-base leading-[1.2] font-semibold text-muted-foreground uppercase'>
            {t('eyebrow')}
          </span>
          <h2 className='text-[26px] leading-[1.2] md:text-[32px]'>{t('title')}</h2>
        </div>
        <div className='flex flex-col gap-5'>
          <p className='text-lg leading-normal text-muted-foreground'>{t('description')}</p>
          <Button asChild size='pill' className='self-start'>
            <Link href='/courses?price=paid'>{t('cta')}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
