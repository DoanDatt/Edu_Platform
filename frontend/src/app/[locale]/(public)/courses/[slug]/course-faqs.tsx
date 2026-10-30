import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'

// Câu hỏi thường gặp của khóa học (tab FAQs). Backend CHƯA có FAQ riêng cho từng khóa →
// tạm dùng bộ câu hỏi MẪU chung (messages/*.json, CourseDetail.faqItems), sẽ thay bằng dữ liệu thật sau.
// Mỗi câu là 1 khung trắng mở / đóng bằng <details> (không cần JS); câu đang mở có tiêu đề cam như Figma
const FAQ_KEYS = ['access', 'certificate', 'refund', 'support'] as const

export default function CourseFaqs() {
  const t = useTranslations('CourseDetail')
  return (
    <div className='flex flex-col gap-4'>
      {FAQ_KEYS.map((key, index) => (
        <details key={key} open={index === 0} className='group rounded-xl bg-card px-5'>
          <summary className='flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium group-open:text-primary [&::-webkit-details-marker]:hidden'>
            {t(`faqItems.${key}.question`)}
            <ChevronDown className='size-4 shrink-0 transition-transform group-open:rotate-180' />
          </summary>
          <p className='pb-5 leading-relaxed text-muted-foreground'>{t(`faqItems.${key}.answer`)}</p>
        </details>
      ))}
    </div>
  )
}
