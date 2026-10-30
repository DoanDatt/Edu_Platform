import courseApiRequest from '@/apiRequests/course'
import { Skeleton } from '@/components/ui/skeleton'
import { getLocale, getTranslations } from 'next-intl/server'

// 4 ô số liệu theo Figma EduPress ("Counter box", node 1:1355): nền xám nhạt, số cam 32px, nhãn 18px.
// Số THẬT, tính từ danh sách khóa học công khai (không bịa số cho đẹp). Figma ghi "Satisfaction Rate 100%",
// web chỉ có điểm đánh giá trung bình → ghi đúng là điểm trung bình.
// Backend chưa có API thống kê công khai → lấy tối đa 100 khóa rồi tự cộng (đủ cho quy mô hiện tại)
export default async function StatsStrip() {
  const result = await courseApiRequest
    .list({ limit: 100 })
    .then((res) => res.payload)
    .catch(() => null)
  if (!result || result.totalItems === 0) return null
  const [t, locale] = await Promise.all([getTranslations('Stats'), getLocale()])
  const formatNumber = (value: number) => value.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')

  const courses = result.data
  const enrollments = courses.reduce((sum, course) => sum + course.studentCount, 0)
  const instructors = new Set(courses.map((course) => course.instructor.id)).size
  // Điểm trung bình có trọng số: khóa nhiều đánh giá thì ảnh hưởng nhiều hơn khóa chỉ có 1 đánh giá
  const totalReviews = courses.reduce((sum, course) => sum + course.rating.totalReviews, 0)
  const ratingSum = courses.reduce((sum, c) => sum + c.rating.averageRating * c.rating.totalReviews, 0)
  const averageRating = totalReviews > 0 ? (ratingSum / totalReviews).toFixed(1) : null

  const stats = [
    { value: formatNumber(enrollments), label: t('enrollments') },
    { value: formatNumber(result.totalItems), label: t('courses') },
    { value: formatNumber(instructors), label: t('instructors') },
    ...(averageRating ? [{ value: `${averageRating}/5`, label: t('averageRating') }] : [])
  ]

  return (
    <section aria-label={t('label')} className='grid grid-cols-2 gap-4 md:gap-[30px] lg:grid-cols-4'>
      {stats.map(({ value, label }) => (
        <div
          key={label}
          className='flex flex-col items-center justify-center gap-4 rounded-[20px] bg-secondary px-4 py-8 text-center md:py-[50px]'
        >
          <span className='font-heading text-[28px] leading-[1.2] font-semibold text-primary md:text-[32px]'>
            {value}
          </span>
          <span className='text-lg leading-normal font-medium capitalize'>{label}</span>
        </div>
      ))}
    </section>
  )
}

export function StatsStripSkeleton() {
  return (
    <div className='grid grid-cols-2 gap-4 md:gap-[30px] lg:grid-cols-4'>
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className='h-[181px] rounded-[20px]' />
      ))}
    </div>
  )
}
