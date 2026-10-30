import { ChartNoAxesColumnIncreasing, CreditCard, LucideIcon, MonitorSmartphone, PlayCircle } from 'lucide-react'

// Điểm mạnh của nền tảng ở trang /about: chỉ ghi những gì web LÀM ĐƯỢC THẬT (không hứa tính năng chưa có).
// Chữ nằm ở messages/*.json, namespace "Features" (mỗi điểm có title + description)
export const features = [
  { Icon: PlayCircle, key: 'video' },
  { Icon: ChartNoAxesColumnIncreasing, key: 'progress' },
  { Icon: CreditCard, key: 'payment' },
  { Icon: MonitorSmartphone, key: 'anywhere' }
] as const satisfies { Icon: LucideIcon; key: string }[]
