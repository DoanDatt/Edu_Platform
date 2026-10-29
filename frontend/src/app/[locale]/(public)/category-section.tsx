import categoryApiRequest from '@/apiRequests/category'
import SectionHeading from '@/components/section-heading'
import { Skeleton } from '@/components/ui/skeleton'
import { getCategoryStyle } from '@/constants/category'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'

// Ô danh mục dạng ảnh: ảnh nền + lớp phủ tối + tên và số khóa ở giữa.
// Danh mục không có ảnh riêng → backend lấy ảnh bìa khóa đông học viên nhất (coverImage).
// Chưa có khóa nào có ảnh → nền gradient theo danh mục + icon lớn mờ làm "ảnh".
// Bấm 1 ô → /courses?categoryId=... Bộ lọc nằm trên URL nên trang /courses tự lọc sẵn
export default async function CategorySection() {
  const categories = await categoryApiRequest
    .list({ limit: 100 })
    .then((res) => res.payload.data)
    .catch(() => [])

  if (categories.length === 0) return null
  const t = await getTranslations('Categories')

  return (
    <section className='flex flex-col gap-6'>
      <SectionHeading eyebrow={t('eyebrow')} title={t('title')} />
      {/* auto-fit: số cột tự theo số danh mục (mỗi ô rộng tối thiểu 13rem), cột thừa bị gộp lại
          → 4 danh mục thì 4 ô chia đều cả hàng, không để trống ô cuối */}
      <div className='grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4'>
        {categories.map((category) => {
          // Icon + màu gradient theo danh mục: trùng màu với ảnh bìa tự vẽ của khóa trong danh mục đó
          const { Icon, gradient } = getCategoryStyle(category)
          return (
            <Link
              key={category.id}
              href={`/courses?categoryId=${category.id}`}
              className={cn(
                'group relative flex aspect-5/2 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20',
                gradient
              )}
            >
              {category.coverImage ? (
                <Image
                  src={category.coverImage}
                  alt=''
                  fill
                  sizes='(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw'
                  className='scale-105 object-cover blur-[2px] transition-all duration-500 group-hover:scale-110 group-hover:blur-none'
                />
              ) : (
                <Icon
                  aria-hidden
                  className='absolute -right-3 -bottom-4 size-28 -rotate-12 text-white/20 transition-transform duration-500 group-hover:scale-110'
                />
              )}
              {/* Ảnh bìa khóa học thường có sẵn chữ → làm mờ nhẹ (blur) + phủ tối để tên danh mục không bị chữ trong ảnh đè.
                  Rê chuột: ảnh nét lại, phủ ngả xanh thương hiệu */}
              <span
                aria-hidden
                className={cn(
                  'absolute inset-0 transition-colors duration-300',
                  category.coverImage
                    ? 'bg-slate-950/65 group-hover:bg-sky-950/55'
                    : 'bg-slate-950/10 group-hover:bg-slate-950/0'
                )}
              />
              <span className='relative flex flex-col items-center gap-1.5 px-4 text-center'>
                <span className='font-heading text-lg leading-tight font-semibold drop-shadow-sm'>{category.name}</span>
                <span className='rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm'>
                  {t('courseCount', { count: category.courseCount })}
                </span>
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
      <Skeleton className='h-16 w-64' />
      <div className='grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4'>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className='aspect-5/2 rounded-2xl' />
        ))}
      </div>
    </div>
  )
}
