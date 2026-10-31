import courseApiRequest from '@/apiRequests/course'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

// Vị trí + kích thước 6 ảnh xoay 30° theo Figma (banner "Education WordPress Theme", node 1:1375, khung 1290 × 300):
// 3 ảnh bên trái, 3 ảnh bên phải, ảnh tràn ra ngoài khung bị cắt bởi overflow-hidden
const SLOTS = [
  'left-[-60px] top-[133px] h-[152px] w-[300px]',
  'left-[-15px] top-[-27px] h-[134px] w-[263px]',
  'left-[79px] top-[81px] h-[125px] w-[246px]',
  'left-[1175px] top-[150px] h-[130px] w-[257px]',
  'left-[955px] top-[-14px] h-[131px] w-[258px]',
  'left-[967px] top-[121px] h-[153px] w-[300px]'
]

// Banner thứ hai của trang chủ (vị trí banner "Education WordPress Theme" trong Figma): nền gradient hồng → xanh nhạt,
// chữ ở giữa, 2 bên là các ảnh xoay nghiêng. Figma dùng ảnh chụp theme của ThimPress → thay bằng ẢNH BÌA THẬT
// của các khóa học trên web. Nội dung: mời làm giảng viên. Async Server Component → page.tsx bọc <Suspense>
export default async function InstructorBanner() {
  const t = await getTranslations('InstructorBanner')
  // Lấy khóa đông học viên có ảnh bìa; thiếu ảnh thì banner vẫn hiện, chỉ ít ảnh trang trí hơn
  const thumbnails = await courseApiRequest
    .list({ sort: 'popular', limit: 30 })
    .then((res) => res.payload.data.flatMap((course) => (course.thumbnail ? [course.thumbnail] : [])))
    .catch(() => [])

  return (
    <section className='relative overflow-hidden rounded-[20px] bg-[linear-gradient(102.5deg,#feb6b6_0%,#b7e1ff_100%)] px-6 py-12 xl:h-[300px] xl:py-0 dark:bg-[linear-gradient(102.5deg,#3d2626_0%,#1f2f3d_100%)]'>
      {/* Ảnh trang trí: chỉ ở màn rộng (≥1280px) vì toạ độ tính theo khung 1290px */}
      <div aria-hidden className='pointer-events-none absolute inset-0 hidden xl:block'>
        {SLOTS.slice(0, thumbnails.length).map((slot, index) => (
          <div
            key={slot}
            className={`absolute rotate-30 overflow-hidden rounded-[20px] shadow-[0_4px_10px_rgba(0,0,0,0.1)] ${slot}`}
          >
            <Image src={thumbnails[index]} alt='' fill sizes='300px' className='object-cover' />
          </div>
        ))}
      </div>

      <div className='relative mx-auto flex h-full max-w-[600px] flex-col items-center justify-center gap-6 text-center'>
        <div className='flex flex-col items-center gap-3'>
          <span className='font-heading text-base leading-[1.2] font-semibold uppercase'>{t('eyebrow')}</span>
          <h2 className='text-[26px] leading-[1.2] md:text-[32px]'>{t('title')}</h2>
        </div>
        <div className='flex flex-col items-center gap-5'>
          <p className='text-lg leading-normal text-muted-foreground'>{t('description')}</p>
          <Button asChild size='pill'>
            <Link href='/about#giang-vien'>{t('cta')}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
