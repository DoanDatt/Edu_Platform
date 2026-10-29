import { LogoMark } from '@/components/logo'
import PageBanner from '@/components/page-banner'
import SectionHeading from '@/components/section-heading'
import { Button } from '@/components/ui/button'
import Waves from '@/components/waves'
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Compass,
  CreditCard,
  Eye,
  Heart,
  LucideIcon,
  MessageSquareText,
  PlayCircle,
  Target,
  UserPlus
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { features } from '../about-section'
import CtaSection from '../cta-section'
import StatsStrip, { StatsStripSkeleton } from '../stats-strip'

export const metadata: Metadata = {
  title: 'Giới thiệu',
  description: 'EduPlatform là nền tảng học trực tuyến giúp bạn học đều đặn, thanh toán dễ dàng và thấy rõ tiến độ.'
}

const values: { Icon: LucideIcon; title: string; description: string }[] = [
  {
    Icon: Target,
    title: 'Sứ mệnh',
    description: 'Giúp người tự học online đi hết khóa học, không bỏ dở giữa chừng.'
  },
  {
    Icon: Eye,
    title: 'Tầm nhìn',
    description: 'Một nơi người Việt chọn khóa, học và theo dõi tiến bộ của mình thật đơn giản.'
  },
  {
    Icon: Heart,
    title: 'Giá trị',
    description: 'Minh bạch: tiến độ đúng thực tế, đánh giá từ học viên thật, giá hiển thị rõ ràng.'
  }
]

// Các bước học trên nền tảng: đúng luồng web đang chạy (đăng ký → mua → học → đánh giá)
const steps: { Icon: LucideIcon; title: string; description: string }[] = [
  { Icon: UserPlus, title: 'Tạo tài khoản', description: 'Đăng ký miễn phí bằng email, vào học được ngay.' },
  {
    Icon: CreditCard,
    title: 'Chọn khóa & thanh toán',
    description: 'Khóa miễn phí ghi danh 1 chạm. Khóa có phí trả bằng chuyển khoản QR hoặc PayPal.'
  },
  {
    Icon: PlayCircle,
    title: 'Học & theo dõi tiến độ',
    description: 'Xem đủ 90% video là bài tự hoàn thành, phần trăm khóa học cập nhật theo.'
  },
  {
    Icon: MessageSquareText,
    title: 'Đánh giá khóa học',
    description: 'Chấm sao và viết cảm nhận để giúp người học sau chọn đúng khóa.'
  }
]

const faqs: { question: string; answer: string }[] = [
  {
    question: 'Mua khóa học rồi thì học được trong bao lâu?',
    answer:
      'Không giới hạn thời gian. Khóa đã ghi danh luôn nằm trong "Khóa học của tôi", bạn học lại lúc nào cũng được.'
  },
  {
    question: 'Có những cách thanh toán nào?',
    answer:
      'Chuyển khoản ngân hàng bằng mã QR (hệ thống tự nhận tiền và mở khóa trong ít phút) hoặc PayPal cho người học ở nước ngoài.'
  },
  {
    question: 'Tôi đã chuyển khoản nhưng khóa học chưa mở?',
    answer:
      'Hãy giữ nguyên nội dung chuyển khoản có mã đơn. Trang thanh toán tự kiểm tra lại mỗi vài giây; đơn đang chờ luôn xem được ở biểu tượng giỏ hàng trên đầu trang.'
  },
  {
    question: 'Khi nào một bài học được tính là đã học xong?',
    answer:
      'Khi bạn xem được ít nhất 90% thời lượng video. Tua nhanh không được tính, nên phần trăm hoàn thành luôn phản ánh đúng việc học thật.'
  },
  {
    question: 'Làm sao để trở thành giảng viên?',
    answer:
      'Tài khoản giảng viên do quản trị viên cấp quyền. Sau đó bạn tạo khóa học, thêm chương, bài và video, rồi gửi duyệt trước khi khóa được xuất bản.'
  }
]

// Trang Giới thiệu (About us). Mỗi khối có id để menu "Giới thiệu" nhảy thẳng tới.
// scroll-mt: chừa chỗ cho header dính 2 tầng, không thì tiêu đề khối bị header che mất
export default function AboutPage() {
  return (
    <div className='flex flex-col gap-20'>
      <div className='flex flex-col'>
        <PageBanner
          eyebrow='Về chúng tôi'
          title='Học online đều đặn và thấy rõ mình tiến bộ'
          description='EduPlatform gói gọn mọi thứ cần cho việc tự học: chọn khóa, thanh toán, học bài và theo dõi tiến độ.'
          className='pb-24 md:pb-28'
        />
        {/* Số liệu thật chồng lên đáy banner, giống trang chủ */}
        <div className='relative z-10 -mt-14 px-4 md:px-8'>
          <Suspense fallback={<StatsStripSkeleton />}>
            <StatsStrip />
          </Suspense>
        </div>
      </div>

      <section id='cau-chuyen' className='grid scroll-mt-32 items-center gap-12 lg:grid-cols-[1.1fr_1fr]'>
        <div className='flex flex-col gap-5'>
          <SectionHeading
            align='left'
            eyebrow='Câu chuyện'
            title='Bắt đầu từ một câu hỏi: vì sao học online hay bỏ dở?'
          />
          <p className='leading-relaxed text-muted-foreground'>
            Mua khóa học thì dễ, học hết mới khó. Video dài, không biết mình đã học tới đâu, tích &quot;đã học&quot; cho
            có mà thật ra chưa xem. EduPlatform được làm ra để giải quyết đúng những chuyện đó.
          </p>
          <p className='leading-relaxed text-muted-foreground'>
            Bài giảng chia nhỏ theo chương, tiến độ tính theo thời gian xem thật, thanh toán xong là vào học ngay. Học
            viên thấy rõ mình đang ở đâu, giảng viên biết khóa học của mình được đón nhận ra sao.
          </p>
        </div>
        <div className='grid gap-4'>
          {values.map(({ Icon, title, description }) => (
            <div key={title} className='flex gap-4 rounded-2xl border bg-card p-5 shadow-sm'>
              <span className='flex size-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-sky-400 to-blue-600 text-white shadow-md shadow-sky-500/25'>
                <Icon className='size-6' />
              </span>
              <div className='flex flex-col gap-1'>
                <h3 className='font-heading text-lg font-semibold'>{title}</h3>
                <p className='text-sm leading-relaxed text-muted-foreground'>{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id='diem-noi-bat' className='flex scroll-mt-32 flex-col gap-10'>
        <SectionHeading
          eyebrow='Điểm nổi bật'
          title='Mọi thứ bạn cần để tự học hiệu quả'
          description='Chỉ những tính năng đang chạy thật trên nền tảng'
        />
        <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-4'>
          {features.map(({ Icon, title, description }) => (
            <div
              key={title}
              className='flex flex-col gap-4 rounded-3xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10'
            >
              <span className='flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                <Icon className='size-6' />
              </span>
              <h3 className='font-heading text-lg font-semibold'>{title}</h3>
              <p className='text-sm leading-relaxed text-muted-foreground'>{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id='cach-hoc' className='flex scroll-mt-32 flex-col gap-10'>
        <SectionHeading eyebrow='Cách hoạt động' title='Bắt đầu học chỉ với 4 bước' />
        {/* Đường nối giữa các bước (chỉ ở màn rộng, các bước nằm cùng hàng) */}
        <ol className='relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4'>
          <div
            aria-hidden
            className='absolute top-8 right-[12.5%] left-[12.5%] hidden border-t-2 border-dashed border-primary/30 lg:block'
          />
          {steps.map(({ Icon, title, description }, index) => (
            <li key={title} className='relative flex flex-col items-center gap-3 text-center'>
              <span className='relative flex size-16 items-center justify-center rounded-full border-4 border-background bg-linear-to-br from-sky-400 to-blue-600 text-white shadow-lg shadow-sky-500/30'>
                <Icon className='size-7' />
                <span className='absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-highlight text-xs font-bold text-white'>
                  {index + 1}
                </span>
              </span>
              <h3 className='mt-1 font-heading text-lg font-semibold'>{title}</h3>
              <p className='max-w-64 text-sm leading-relaxed text-muted-foreground'>{description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        id='giang-vien'
        className='relative grid scroll-mt-32 items-center gap-8 overflow-hidden rounded-3xl bg-linear-to-br from-sky-500 via-sky-600 to-blue-800 p-8 text-white md:p-12 lg:grid-cols-[1fr_auto]'
      >
        <div aria-hidden className='absolute -top-20 -right-10 size-72 rounded-full bg-white/15 blur-3xl' />
        <Waves className='h-1/3' animated />
        <div className='relative flex flex-col gap-4'>
          <span className='text-xs font-semibold tracking-widest text-white/80 uppercase'>Dành cho giảng viên</span>
          <h2 className='max-w-xl text-3xl leading-tight font-bold text-balance'>Chia sẻ kiến thức của bạn</h2>
          <ul className='grid gap-2 text-white/90 sm:grid-cols-2'>
            {[
              'Tạo khóa học, chia chương và bài',
              'Tải video bài giảng lên trực tiếp',
              'Gửi duyệt trước khi xuất bản',
              'Theo dõi học viên và doanh thu'
            ].map((item) => (
              <li key={item} className='flex items-center gap-2'>
                <CheckCircle2 className='size-4 shrink-0' /> {item}
              </li>
            ))}
          </ul>
          <p className='text-sm text-white/75'>Tài khoản giảng viên do quản trị viên cấp quyền.</p>
        </div>
        <div className='relative flex flex-col items-start gap-4 lg:items-center'>
          <LogoMark className='hidden size-24 rounded-[1.75rem] bg-none bg-white/15 shadow-none lg:flex [&_svg]:size-14' />
          <Button asChild size='lg' className='rounded-full bg-white px-6 text-sky-700 hover:bg-white/90'>
            <Link href='/instructor'>
              Vào Dashboard giảng viên <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      <section id='hoi-dap' className='grid scroll-mt-32 gap-10 lg:grid-cols-[1fr_1.6fr]'>
        <div className='flex flex-col gap-5'>
          <SectionHeading
            align='left'
            eyebrow='Hỏi đáp'
            title='Câu hỏi thường gặp'
            description='Chưa thấy câu trả lời? Xem thêm các bài hướng dẫn trên Blog.'
          />
          <Link href='/blog?category=huong-dan' className='flex w-fit items-center gap-1.5 font-medium text-primary'>
            <Compass className='size-4' /> Hướng dẫn sử dụng <ArrowRight className='size-4' />
          </Link>
        </div>
        {/* <details>: mở / đóng không cần JS, bàn phím dùng được sẵn */}
        <div className='flex flex-col gap-3'>
          {faqs.map(({ question, answer }) => (
            <details
              key={question}
              className='group rounded-2xl border bg-card px-5 shadow-sm transition-colors open:border-primary/30'
            >
              <summary className='flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold [&::-webkit-details-marker]:hidden'>
                {question}
                <ChevronDown className='size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 group-open:text-primary' />
              </summary>
              <p className='pb-5 leading-relaxed text-muted-foreground'>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <CtaSection />
    </div>
  )
}
