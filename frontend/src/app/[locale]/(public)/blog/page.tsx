import PageBanner from '@/components/page-banner'
import { BlogCategory, blogCategories, getBlogCategoryName, getBlogPosts } from '@/content/blog'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import BlogCard from './blog-card'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Blog')
  return { title: t('metaTitle'), description: t('metaDescription') }
}

// /blog?category=lap-trinh: danh sách bài viết, lọc theo chuyên mục trên URL
export default function BlogPage({ searchParams }: PageProps<'/[locale]/blog'>) {
  const t = useTranslations('Blog')

  return (
    <div className='flex flex-col gap-8'>
      <PageBanner title={t('title')} description={t('description')} breadcrumbLabel='Blog' />
      {/* searchParams là dữ liệu lúc chạy → đọc trong component con bọc Suspense */}
      <Suspense>
        <BlogList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function BlogList({ searchParams }: { searchParams: PageProps<'/[locale]/blog'>['searchParams'] }) {
  const [t, locale] = await Promise.all([getTranslations('Blog'), getLocale()])
  const raw = (await searchParams).category
  // Chuyên mục lạ (?category=abc) → coi như xem tất cả
  const category = typeof raw === 'string' && raw in blogCategories ? (raw as BlogCategory) : undefined
  const posts = getBlogPosts(locale).filter((post) => !category || post.category === category)

  const filters: { value?: BlogCategory; label: string }[] = [
    { label: t('all') },
    ...(Object.keys(blogCategories) as BlogCategory[]).map((value) => ({
      value,
      label: getBlogCategoryName(value, locale)
    }))
  ]

  return (
    <div className='flex flex-col gap-6'>
      <nav aria-label={t('categories')} className='flex flex-wrap gap-2'>
        {filters.map(({ value, label }) => (
          <Link
            key={label}
            href={value ? `/blog?category=${value}` : '/blog'}
            aria-current={category === value ? 'page' : undefined}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              category === value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className='grid gap-[30px] pt-4 sm:grid-cols-2 lg:grid-cols-3'>
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  )
}
