import TopHeading from '@/components/top-heading'
import { getBlogPosts } from '@/content/blog'
import { useLocale, useTranslations } from 'next-intl'
import BlogCard from './blog/blog-card'

// "Latest Articles" theo Figma EduPress (node 1:1420), khối cuối trang chủ: tiêu đề bên trái + nút "All Articles",
// 3 bài viết mới nhất (cùng thẻ với trang /blog). Bài viết nằm sẵn trong code (content/blog.ts) → không gọi API
export default function LatestArticles() {
  const t = useTranslations('LatestArticles')
  const locale = useLocale()
  const posts = getBlogPosts(locale).slice(0, 3)
  if (posts.length === 0) return null

  return (
    <section className='flex flex-col gap-[34px]'>
      <TopHeading title={t('title')} description={t('description')} action={{ label: t('viewAll'), href: '/blog' }} />
      <div className='grid gap-[30px] pt-4 sm:grid-cols-2 lg:grid-cols-3'>
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  )
}
