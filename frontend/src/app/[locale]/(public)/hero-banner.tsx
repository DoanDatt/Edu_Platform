import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

// Hero theo Figma EduPress (node 1:1277): nền gradient vàng → xanh ngọc cao 700px tràn ngang,
// chữ bên trái trong khung 1290px, ảnh học viên + chữ "ONLINE SCHOOL" mờ bên phải, hình trang trí ở các mép.
// Toạ độ lấy từ Figma (khung 1920px). Hình sát MÉP màn hình bám theo mép (left / right),
// hình gắn với ảnh học viên bám theo khung nội dung → màn hình rộng hẹp khác nhau vẫn đúng vị trí tương đối
const asset = (name: string) => `/edupress/home/${name}`

export default function HeroBanner() {
  const t = useTranslations('Hero')

  return (
    // -mt-6 md:-mt-8: bù khoảng đệm trên của <main> → banner nằm sát header như Figma
    <section className='relative left-1/2 -mt-6 w-screen -translate-x-1/2 overflow-hidden bg-[linear-gradient(110.5deg,#fff5be_0%,#d0f7ea_97.7%)] md:-mt-8 dark:bg-[linear-gradient(110.5deg,#3a3420_0%,#1d3a33_97.7%)]'>
      {/* ===== Hình trang trí bám mép màn hình (ẩn trên điện thoại cho gọn) ===== */}
      <div aria-hidden className='pointer-events-none absolute inset-0 hidden md:block'>
        <Image
          src={asset('hero-blob-bottom-left.svg')}
          alt=''
          width={643}
          height={448}
          className='absolute top-[252px] -left-[5px]'
        />
        {/* Nét vẽ trắng: nền sáng thì mờ sẵn, nền tối thì nổi quá → giảm độ đậm ở giao diện tối */}
        <Image
          src={asset('hero-doodle-left.svg')}
          alt=''
          width={440}
          height={354}
          className='absolute top-10 left-[87px] dark:opacity-25'
        />
        <Image
          src={asset('hero-blob-top-right.svg')}
          alt=''
          width={481}
          height={219}
          className='absolute top-0 right-0'
        />
        <Image
          src={asset('hero-blob-bottom-right.svg')}
          alt=''
          width={347}
          height={312}
          className='absolute top-[364px] -right-[91px]'
        />
      </div>

      {/* ===== Nội dung: khung 1290px, chiều cao 700px trên màn hình lớn ===== */}
      <div className='relative container-page flex min-h-[480px] items-center py-16 lg:h-[700px] lg:py-0'>
        <div className='relative z-10 flex max-w-[520px] flex-col gap-6'>
          {/* h1 thật của trang chủ (Figma: H1 Exo 48px) */}
          <h1 className='text-[36px] leading-[1.2] capitalize md:text-5xl'>{t('title')}</h1>
          <div className='flex flex-col gap-5'>
            <p className='text-lg leading-normal text-muted-foreground'>{t('description')}</p>
            <Button asChild size='pill' className='self-start'>
              <Link href='/courses'>{t('cta')}</Link>
            </Button>
          </div>
        </div>

        {/* ===== Ảnh bên phải: toạ độ tính từ mép trái khung nội dung (Figma: khung bắt đầu ở x = 315) ===== */}
        <div aria-hidden className='pointer-events-none absolute inset-y-0 left-0 hidden w-full lg:block'>
          <div className='relative mx-auto h-full max-w-[1290px]'>
            {/* "ONLINE SCHOOL" mờ phía sau: x 720 → 405 trong khung, 977 × 419, mờ 50% */}
            <Image
              src={asset('hero-online-school.png')}
              alt=''
              width={977}
              height={419}
              className='absolute top-[141px] left-[405px] h-[419px] w-[977px] max-w-none object-cover opacity-50 dark:opacity-15'
            />
            <Image
              src={asset('hero-sparkle.svg')}
              alt=''
              width={66}
              height={76}
              className='absolute top-[21.5px] left-[893px]'
            />
            <Image
              src={asset('hero-objects.svg')}
              alt=''
              width={95}
              height={82}
              className='absolute top-[7px] left-[1030px]'
            />
            {/* Ảnh học viên: cao 1043px, đỉnh lệch -93px, phần dưới bị cắt bởi đáy banner (overflow-hidden) */}
            <Image
              src={asset('hero-student.png')}
              alt=''
              width={696}
              height={1043}
              priority
              sizes='696px'
              className='absolute -top-[93px] left-[694px] h-[1043px] w-[696px] max-w-none object-cover'
            />
          </div>
        </div>
      </div>
    </section>
  )
}
