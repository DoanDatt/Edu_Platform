import categoryApiRequest from '@/apiRequests/category'
import SectionHeading from '@/components/section-heading'
import { Skeleton } from '@/components/ui/skeleton'
import { getCategoryStyle } from '@/constants/category'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// Bấm 1 ô → /courses?categoryId=... Bộ lọc nằm trên URL nên trang /courses tự lọc sẵn, không cần viết thêm gì
export default async function CategorySection() {
  const categories = await categoryApiRequest
    .list({ limit: 100 })
    .then((res) => res.payload.data)
    .catch(() => [])

  if (categories.length === 0) return null

  return (
    <section className='flex flex-col gap-6'>
      <SectionHeading eyebrow='Danh mục' title='Khám phá theo chủ đề' />
      {/* auto-fit: số cột tự theo số danh mục (mỗi ô rộng tối thiểu 9.5rem), cột thừa bị gộp lại
          → 4 danh mục thì 4 ô chia đều cả hàng, không để trống ô cuối như khi cố định 5 cột */}
      <div className='grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-4'>
        {categories.map((category) => {
          // Icon + màu gradient theo danh mục: trùng màu với ảnh bìa tự vẽ của khóa trong danh mục đó
          const { Icon, gradient } = getCategoryStyle(category)
          return (
            <Link
              key={category.id}
              href={`/courses?categoryId=${category.id}`}
              // Điện thoại (ô hẹp): icon trên, tên dưới cho tên không bị gãy 3 dòng. Từ sm: icon bên trái tên
              className='group flex flex-col items-start gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10'
            >
              {/* group-hover: rê chuột vào CẢ Ô thì icon phóng to nhẹ */}
              <span
                className={cn(
                  'flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-white shadow-sm transition-transform group-hover:scale-105',
                  gradient
                )}
              >
                <Icon className='size-5' />
              </span>
              <span className='flex min-w-0 flex-col'>
                <span className='font-medium transition-colors group-hover:text-primary'>{category.name}</span>
                <span className='text-xs text-muted-foreground'>{category.courseCount} khóa học</span>
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export function CategorySectionSkeleton() {
  return (
    <div className='flex flex-col gap-6'>
      <Skeleton className='h-8 w-64' />
      <div className='grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-4'>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className='h-18 rounded-xl' />
        ))}
      </div>
    </div>
  )
}
