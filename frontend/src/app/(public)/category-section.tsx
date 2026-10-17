import categoryApiRequest from '@/apiRequests/category'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart3, Code, LayoutGrid, LucideIcon, Megaphone, Palette } from 'lucide-react'
import Link from 'next/link'

// DB không lưu icon cho danh mục → tự gán theo tên. Danh mục mới (admin thêm sau) dùng icon mặc định
const categoryIcons: Record<string, LucideIcon> = {
  'Lập trình Web': Code,
  'Thiết kế': Palette,
  Marketing: Megaphone,
  'Khoa học dữ liệu': BarChart3
}

// Bấm vào danh mục → /courses?categoryId=... Bộ lọc nằm trên URL nên không cần viết thêm logic gì
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
          const Icon = categoryIcons[category.name] ?? LayoutGrid
          return (
            <Link
              key={category.id}
              href={`/courses?categoryId=${category.id}`}
              className='group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary hover:bg-accent'
            >
              <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground'>
                <Icon className='size-5' />
              </span>
              <span className='font-medium'>{category.name}</span>
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
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className='h-18 rounded-xl' />
        ))}
      </div>
    </div>
  )
}
