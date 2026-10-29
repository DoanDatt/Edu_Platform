import SectionHeading from '@/components/section-heading'
import { Button } from '@/components/ui/button'
import Waves from '@/components/waves'
import { LogoMark } from '@/components/logo'
import {
  ArrowRight,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  CreditCard,
  LucideIcon,
  MonitorSmartphone,
  PlayCircle,
  QrCode
} from 'lucide-react'
import Link from 'next/link'

// Điểm mạnh của nền tảng: chỉ ghi những gì web LÀM ĐƯỢC THẬT (không hứa tính năng chưa có). Dùng lại ở trang /about
export const features: { Icon: LucideIcon; title: string; description: string }[] = [
  {
    Icon: PlayCircle,
    title: 'Bài giảng video',
    description: 'Chia theo chương, từng bài ngắn gọn, mở lại là xem tiếp từ chỗ đang dừng.'
  },
  {
    Icon: ChartNoAxesColumnIncreasing,
    title: 'Tiến độ minh bạch',
    description: 'Xem đủ 90% video mới tính là học xong, phần trăm hoàn thành luôn đúng thực tế.'
  },
  {
    Icon: CreditCard,
    title: 'Thanh toán linh hoạt',
    description: 'Chuyển khoản quét mã QR (xác nhận tự động) hoặc PayPal cho người học quốc tế.'
  },
  {
    Icon: MonitorSmartphone,
    title: 'Học mọi lúc, mọi nơi',
    description: 'Giao diện chạy tốt trên điện thoại lẫn máy tính, có chế độ tối cho buổi học đêm.'
  }
]

// Khối giới thiệu 2 cột: trái là cụm minh họa (khung gradient có sóng + các thẻ giao diện nổi), phải là chữ + điểm mạnh.
// Minh họa chỉ để trang trí (aria-hidden): mô phỏng đúng các tính năng có thật, không phải số liệu
export default function AboutSection() {
  return (
    <section className='grid items-center gap-14 lg:grid-cols-2'>
      <div aria-hidden className='relative mx-auto h-[26rem] w-full max-w-lg'>
        <div className='absolute inset-x-6 inset-y-0 overflow-hidden rounded-[2.5rem] bg-linear-to-br from-sky-400 via-sky-500 to-blue-700 shadow-2xl shadow-sky-900/20'>
          <div className='absolute -top-16 -right-16 size-64 rounded-full bg-white/20 blur-2xl' />
          <Waves className='h-1/3' animated />
          <LogoMark className='absolute top-1/2 left-1/2 size-32 -translate-1/2 rounded-[2rem] bg-none bg-white/15 shadow-none [&_svg]:size-20' />
        </div>

        {/* Thẻ "đang học" với thanh xem video */}
        <div className='absolute top-8 -left-2 w-60 rounded-2xl border bg-card p-4 shadow-xl motion-safe:animate-float'>
          <p className='text-xs text-muted-foreground'>Đang học · Chương 3</p>
          <p className='mt-0.5 font-heading font-semibold'>Custom hook</p>
          <div className='mt-3 h-2 overflow-hidden rounded-full bg-muted'>
            <div className='h-full w-[72%] rounded-full bg-linear-to-r from-sky-400 to-primary' />
          </div>
          <p className='mt-1.5 text-xs text-muted-foreground'>Đã xem 72% · cần 90% để hoàn thành</p>
        </div>

        {/* Nhãn "tự hoàn thành" */}
        <div className='absolute top-1/2 -right-2 flex items-center gap-2 rounded-2xl border bg-card px-3.5 py-2.5 text-sm font-medium shadow-xl motion-safe:animate-float motion-safe:[animation-delay:-2s]'>
          <CheckCircle2 className='size-5 text-emerald-500' />
          Tự hoàn thành bài học
        </div>

        {/* Thẻ thanh toán QR */}
        <div className='absolute bottom-6 left-8 flex items-center gap-3 rounded-2xl border bg-card p-3.5 shadow-xl motion-safe:animate-float motion-safe:[animation-delay:-4s]'>
          <span className='flex size-10 items-center justify-center rounded-xl bg-highlight/10 text-highlight'>
            <QrCode className='size-5' />
          </span>
          <span className='flex flex-col leading-tight'>
            <span className='text-sm font-semibold'>Đã nhận thanh toán</span>
            <span className='text-xs text-muted-foreground'>Chuyển khoản QR · tự động mở khóa</span>
          </span>
        </div>
      </div>

      <div className='flex flex-col gap-8'>
        <SectionHeading
          align='left'
          eyebrow='Về EduPlatform'
          title='Nền tảng giúp bạn học đều đặn và thấy rõ mình tiến bộ'
          description='Mọi thứ cần cho việc tự học online, gói gọn trong một nơi: từ chọn khóa, thanh toán, học bài đến theo dõi tiến độ.'
        />
        <div className='grid gap-6 sm:grid-cols-2'>
          {features.map(({ Icon, title, description }) => (
            <div key={title} className='flex gap-4'>
              <span className='flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                <Icon className='size-6' />
              </span>
              <div className='flex flex-col gap-1'>
                <h3 className='font-semibold'>{title}</h3>
                <p className='text-sm leading-relaxed text-muted-foreground'>{description}</p>
              </div>
            </div>
          ))}
        </div>
        <Button
          asChild
          size='lg'
          className='h-12 w-fit rounded-full bg-linear-to-r from-sky-500 to-blue-600 px-7 text-base shadow-lg shadow-sky-500/25 hover:opacity-95'
        >
          <Link href='/courses'>
            Khám phá khóa học <ArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  )
}
