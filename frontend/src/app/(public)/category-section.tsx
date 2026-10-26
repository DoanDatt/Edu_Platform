import categoryApiRequest from '@/apiRequests/category'
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
      <h2 className='text-2xl font-bold tracking-tight'>Khám phá theo danh mục</h2>
      <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
        {categories.map((category) => {
          // Icon + màu gradient theo danh mục: trùng màu với ảnh bìa tự vẽ của khóa trong danh mục đó
          const { Icon, gradient } = getCategoryStyle(category)
          return (
            <Link
              key={category.id}
              href={`/courses?categoryId=${category.id}`}
              className='group flex items-center gap-3 rounded-2xl bg-muted/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-card'
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
              <span className='font-medium transition-colors group-hover:text-primary'>{category.name}</span>
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
      <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className='h-18 rounded-xl' />
        ))}
      </div>
    </div>
  )
}
