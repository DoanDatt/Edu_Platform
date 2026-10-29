import PageBanner from '@/components/page-banner'
import { BlogCategory, blogCategories, sortedBlogPosts } from '@/content/blog'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import BlogCard from './blog-card'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Lộ trình học, kinh nghiệm học online và hướng dẫn sử dụng EduPlatform'
}

// /blog?category=lap-trinh: danh sách bài viết, lọc theo chuyên mục trên URL
export default function BlogPage({ searchParams }: PageProps<'/blog'>) {
  return (
    <div className='flex flex-col gap-8'>
      <PageBanner
        eyebrow='Blog EduPlatform'
        title='Chia sẻ kiến thức & kinh nghiệm học tập'
        description='Lộ trình học, mẹo học online hiệu quả và hướng dẫn sử dụng nền tảng.'
      />
      {/* searchParams là dữ liệu lúc chạy → đọc trong component con bọc Suspense */}
      <Suspense>
        <BlogList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function BlogList({ searchParams }: { searchParams: PageProps<'/blog'>['searchParams'] }) {
  const raw = (await searchParams).category
  // Chuyên mục lạ (?category=abc) → coi như xem tất cả
  const category = typeof raw === 'string' && raw in blogCategories ? (raw as BlogCategory) : undefined
  const posts = category ? sortedBlogPosts.filter((post) => post.category === category) : sortedBlogPosts

  const filters: { value?: BlogCategory; label: string }[] = [
    { label: 'Tất cả' },
    ...(Object.keys(blogCategories) as BlogCategory[]).map((value) => ({ value, label: blogCategories[value] }))
  ]

  return (
    <div className='flex flex-col gap-6'>
      <nav aria-label='Chuyên mục' className='flex flex-wrap gap-2'>
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
      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  )
}
