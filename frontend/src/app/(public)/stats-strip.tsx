import courseApiRequest from '@/apiRequests/course'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, LucideIcon, Star, UserRound, Users } from 'lucide-react'

// Dải số liệu ngay dưới banner: số THẬT, tính từ danh sách khóa học công khai (không bịa số cho đẹp).
// Backend chưa có API thống kê công khai → lấy tối đa 100 khóa rồi tự cộng (đủ cho quy mô hiện tại)
export default async function StatsStrip() {
  const result = await courseApiRequest
    .list({ limit: 100 })
    .then((res) => res.payload)
    .catch(() => null)
  if (!result || result.totalItems === 0) return null

  const courses = result.data
  const enrollments = courses.reduce((sum, course) => sum + course.studentCount, 0)
  const instructors = new Set(courses.map((course) => course.instructor.id)).size
  // Điểm trung bình có trọng số: khóa nhiều đánh giá thì ảnh hưởng nhiều hơn khóa chỉ có 1 đánh giá
  const totalReviews = courses.reduce((sum, course) => sum + course.rating.totalReviews, 0)
  const ratingSum = courses.reduce((sum, c) => sum + c.rating.averageRating * c.rating.totalReviews, 0)
  const averageRating = totalReviews > 0 ? (ratingSum / totalReviews).toFixed(1) : null

  const stats: { Icon: LucideIcon; value: string; label: string }[] = [
    { Icon: BookOpen, value: result.totalItems.toLocaleString('vi-VN'), label: 'Khóa học' },
    { Icon: Users, value: enrollments.toLocaleString('vi-VN'), label: 'Lượt ghi danh' },
    { Icon: UserRound, value: instructors.toLocaleString('vi-VN'), label: 'Giảng viên' },
    ...(averageRating ? [{ Icon: Star, value: `${averageRating}/5`, label: 'Đánh giá trung bình' }] : [])
  ]

  return (
    <section aria-label='Số liệu nền tảng' className='grid grid-cols-2 gap-4 rounded-3xl border bg-card p-5 md:grid-cols-4 md:p-6'>
      {stats.map(({ Icon, value, label }) => (
        <div key={label} className='flex items-center gap-3'>
          <span className='flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
            <Icon className='size-5' />
          </span>
          <div className='flex flex-col'>
            <span className='font-heading text-xl font-bold md:text-2xl'>{value}</span>
            <span className='text-sm text-muted-foreground'>{label}</span>
          </div>
        </div>
      ))}
    </section>
  )
}

export function StatsStripSkeleton() {
  return <Skeleton className='h-24 rounded-3xl md:h-[5.5rem]' />
}
