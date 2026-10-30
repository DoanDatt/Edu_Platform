import categoryApiRequest from '@/apiRequests/category'
import TopHeading from '@/components/top-heading'
import { Skeleton } from '@/components/ui/skeleton'
import { getCategoryIcon } from '@/constants/category'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

// "Top Categories" theo Figma EduPress (node 1:1298): ô vuông 234px viền xám, icon cam 32px, tên + số khóa.
// Rê chuột (Figma vẽ sẵn trạng thái hover ở ô thứ 2): ô nhô lên 16px, có bóng, tên chuyển cam.
// flex-wrap + justify-center: ít danh mục thì các ô dồn vào giữa hàng như Figma, không để lỗ trống.
// Bấm 1 ô → /courses?categoryId=... (bộ lọc nằm trên URL)
export default async function CategorySection() {
  const categories = await categoryApiRequest
    .list({ limit: 100 })
    .then((res) => res.payload.data)
    .catch(() => [])

  if (categories.length === 0) return null
  const t = await getTranslations('Categories')

  return (
    <section className='flex flex-col gap-[50px]'>
      <TopHeading
        title={t('title')}
        description={t('description')}
        action={{ label: t('viewAll'), href: '/courses' }}
      />
      {/* pt-4: chừa chỗ cho ô nhô lên 16px khi rê chuột, không bị dính vào tiêu đề */}
      <div className='flex flex-wrap justify-center gap-[30px] pt-4'>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/courses?categoryId=${category.id}`}
            className='group flex aspect-square w-[calc(50%-15px)] flex-col items-center justify-center gap-6 rounded-[20px] border bg-card p-4 text-center transition-all duration-300 hover:-translate-y-4 hover:shadow-[0_4px_10px_rgba(0,0,0,0.1)] sm:w-[234px]'
          >
            <Image src={getCategoryIcon(category)} alt='' width={32} height={32} className='size-8' />
            <span className='flex flex-col items-center gap-3'>
              <span className='font-heading text-xl leading-[1.2] font-semibold capitalize transition-colors group-hover:text-primary'>
                {category.name}
              </span>
              <span className='text-lg leading-normal text-muted-foreground'>
                {t('courseCount', { count: category.courseCount })}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function CategorySectionSkeleton() {
  return (
    <div className='flex flex-col gap-[50px]'>
      <Skeleton className='h-[77px] w-full max-w-sm' />
      <div className='flex flex-wrap justify-center gap-[30px] pt-4'>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className='aspect-square w-[calc(50%-15px)] rounded-[20px] sm:w-[234px]' />
        ))}
      </div>
    </div>
  )
}
