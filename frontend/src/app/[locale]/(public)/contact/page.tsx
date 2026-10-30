import BreadcrumbBar from '@/components/breadcrumb-bar'
import { Mail, MapPin } from 'lucide-react'
import type { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import ContactForm from './contact-form'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Contact')
  return { title: t('metaTitle'), description: t('description') }
}

const EMAIL = 'doancongdat2004@gmail.com'
// Bản đồ Google Maps nhúng (link /maps/embed, không cần API key), tìm "Ho Chi Minh City", zoom 13.
// Không dùng OpenStreetMap: một số mạng ở Việt Nam không kết nối được tới openstreetmap.org (bản đồ trắng).
// Figma dùng ảnh bản đồ tĩnh; bản đồ thật kéo / phóng to được
const MAP_URL = 'https://www.google.com/maps/embed?origin=mfe&pb=!1m3!2m1!1sHo+Chi+Minh+City!6i13'

// Trang Liên hệ theo Figma EduPress (Contact):
//   hàng trên: trái "Need A Direct Line?" + mô tả + các dòng liên hệ (icon cam trong ô vuông nhạt), phải bản đồ bo góc
//   hàng dưới: form "Contact Us" rộng hết khung (tên, email, nội dung, ghi nhớ, nút gửi)
// Figma có dòng Phone: số điện thoại chưa công khai trên web → thay bằng địa điểm
export default function ContactPage() {
  const t = useTranslations('Contact')

  const items = [
    { Icon: MapPin, label: t('locationLabel'), value: t('location') },
    { Icon: Mail, label: t('emailLabel'), value: EMAIL, href: `mailto:${EMAIL}` }
  ]

  return (
    <div className='flex flex-col gap-10 lg:gap-[90px]'>
      <div className='flex flex-col gap-10 lg:gap-[60px]'>
        <BreadcrumbBar items={[{ label: t('title') }]} />

        <section className='grid items-start gap-10 lg:grid-cols-[410px_minmax(0,1fr)] lg:gap-[40px]'>
          <div className='flex flex-col gap-5'>
            <h1 className='text-[28px] leading-[1.2] md:text-[32px]'>{t('heading')}</h1>
            <p className='text-lg leading-normal text-muted-foreground'>{t('description')}</p>
            <ul className='flex flex-col gap-5'>
              {items.map(({ Icon, label, value, href }) => (
                <li key={label} className='flex items-center gap-4'>
                  <span className='flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                    <Icon className='size-5' />
                  </span>
                  <span className='flex flex-col'>
                    <span className='text-base text-muted-foreground'>{label}</span>
                    {href ? (
                      <a href={href} className='text-lg font-semibold break-all hover:text-primary'>
                        {value}
                      </a>
                    ) : (
                      <span className='text-lg font-semibold'>{value}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className='overflow-hidden rounded-[20px] border'>
            <iframe
              title={t('mapTitle')}
              src={MAP_URL}
              loading='lazy'
              className='block aspect-[840/450] w-full border-0'
            />
          </div>
        </section>
      </div>

      <ContactForm />
    </div>
  )
}
