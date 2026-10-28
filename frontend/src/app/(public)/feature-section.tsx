import SectionHeading from '@/components/section-heading'
import Waves from '@/components/waves'
import { ChartNoAxesColumnIncreasing, LucideIcon, MessageSquareHeart, MonitorSmartphone, PlayCircle } from 'lucide-react'

// Điểm mạnh của nền tảng: chỉ ghi những gì web LÀM ĐƯỢC THẬT (không hứa tính năng chưa có)
const features: { Icon: LucideIcon; title: string; description: string }[] = [
  {
    Icon: PlayCircle,
    title: 'Bài giảng video',
    description: 'Video chia theo từng chương, từng bài ngắn gọn, xem lại bao nhiêu lần cũng được.'
  },
  {
    Icon: ChartNoAxesColumnIncreasing,
    title: 'Theo dõi tiến độ',
    description: 'Đánh dấu bài đã học, xem phần trăm hoàn thành, quay lại đúng chỗ đang học dở.'
  },
  {
    Icon: MessageSquareHeart,
    title: 'Đánh giá thật',
    description: 'Chỉ học viên đã ghi danh mới được chấm điểm, nên đánh giá phản ánh đúng chất lượng.'
  },
  {
    Icon: MonitorSmartphone,
    title: 'Học mọi lúc, mọi nơi',
    description: 'Giao diện chạy tốt trên điện thoại lẫn máy tính, có chế độ tối cho buổi học đêm.'
  }
]

// Khối nền xanh nhạt xen giữa các lưới khóa học → trang có nhịp, không bị đều đều
export default function FeatureSection() {
  return (
    <section className='relative overflow-hidden rounded-3xl bg-accent/60 px-6 pt-10 pb-16 md:px-10'>
      {/* Sóng màu xanh thương hiệu rất nhạt ở đáy (Waves mặc định trắng → đổi màu cho các thẻ path bên trong) */}
      <Waves className='h-16 [&_path]:fill-primary/5' />
      <div className='relative flex flex-col gap-8'>
        <SectionHeading
          eyebrow='Vì sao chọn EduPlatform'
          title='Học có lộ trình, thấy rõ mình tiến bộ'
          description='Mọi thứ cần cho việc tự học online, gói gọn trong một nơi.'
        />
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {features.map(({ Icon, title, description }) => (
            <div key={title} className='flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-sm'>
              <span className='flex size-11 items-center justify-center rounded-xl bg-linear-to-br from-sky-400 to-blue-600 text-white'>
                <Icon className='size-5' />
              </span>
              <h3 className='font-semibold'>{title}</h3>
              <p className='text-sm text-muted-foreground'>{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
