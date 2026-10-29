import { Button } from '@/components/ui/button'
import { BlogBlock, blogSlugs, formatBlogDate, getBlogCategoryName, getBlogPost, getBlogPosts } from '@/content/blog'
import { ArrowLeft, ArrowRight, CalendarDays, Clock, Lightbulb } from 'lucide-react'
import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import BlogCard, { BlogCover } from '../blog-card'
import { Link } from '@/i18n/navigation'

// Bài viết nằm sẵn trong code → dựng sẵn mọi trang lúc build
export const generateStaticParams = () => blogSlugs.map((slug) => ({ slug }))

export async function generateMetadata({ params }: PageProps<'/[locale]/blog/[slug]'>): Promise<Metadata> {
  const post = getBlogPost((await params).slug, await getLocale())
  if (!post) return { title: (await getTranslations('Blog'))('notFound') }
  return { title: post.title, description: post.excerpt, openGraph: { title: post.title, description: post.excerpt } }
}

export default function BlogPostPage({ params }: PageProps<'/[locale]/blog/[slug]'>) {
  return (
    <Suspense>
      <BlogPostContent params={params} />
    </Suspense>
  )
}

async function BlogPostContent({ params }: { params: PageProps<'/[locale]/blog/[slug]'>['params'] }) {
  const [t, locale] = await Promise.all([getTranslations('Blog'), getLocale()])
  const post = getBlogPost((await params).slug, locale)
  if (!post) notFound()
  const posts = getBlogPosts(locale)

  // Bài liên quan: cùng chuyên mục trước, thiếu thì lấy bài mới nhất khác
  const related = [
    ...posts.filter((p) => p.slug !== post.slug && p.category === post.category),
    ...posts.filter((p) => p.slug !== post.slug && p.category !== post.category)
  ].slice(0, 3)

  return (
    <div className='flex flex-col gap-14'>
      <article className='mx-auto flex w-full max-w-3xl flex-col gap-6'>
        <Link
          href='/blog'
          className='flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='size-4' /> {t('allPosts')}
        </Link>
        <div className='flex flex-col gap-4'>
          <Link
            href={`/blog?category=${post.category}`}
            className='w-fit rounded-full bg-highlight/10 px-3 py-1 text-xs font-semibold text-highlight'
          >
            {getBlogCategoryName(post.category, locale)}
          </Link>
          <h1 className='text-3xl leading-tight font-bold text-balance md:text-4xl'>{post.title}</h1>
          <p className='text-lg text-muted-foreground'>{post.excerpt}</p>
          <div className='flex items-center gap-4 text-sm text-muted-foreground'>
            <span className='flex items-center gap-1.5'>
              <CalendarDays className='size-4' /> {formatBlogDate(post.publishedAt, locale)}
            </span>
            <span className='flex items-center gap-1.5'>
              <Clock className='size-4' /> {t('minRead', { minutes: post.readingMinutes })}
            </span>
          </div>
        </div>
        <div className='overflow-hidden rounded-3xl'>
          <BlogCover post={post} size='lg' />
        </div>
        <div className='flex flex-col gap-5 text-[17px] leading-relaxed'>
          {post.content.map((block, index) => (
            <Block key={index} block={block} />
          ))}
        </div>
      </article>

      {related.length > 0 && (
        <section className='flex flex-col gap-6'>
          <h2 className='text-2xl font-bold'>{t('related')}</h2>
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {related.map((p) => (
              <BlogCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// Vẽ 1 khối nội dung bài viết
function Block({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case 'h2':
      return <h2 className='mt-4 text-2xl font-bold'>{block.text}</h2>
    case 'p':
      return <p className='text-foreground/85'>{block.text}</p>
    case 'ul':
      return (
        <ul className='flex flex-col gap-2 pl-1'>
          {block.items.map((item) => (
            <li key={item} className='flex gap-3 text-foreground/85'>
              <span aria-hidden className='mt-2.5 size-1.5 shrink-0 rounded-full bg-primary' />
              {item}
            </li>
          ))}
        </ul>
      )
    case 'tip':
      return (
        <aside className='flex gap-3 rounded-2xl border border-primary/20 bg-accent/60 p-5'>
          <Lightbulb className='mt-0.5 size-5 shrink-0 text-primary' />
          <p className='text-base'>{block.text}</p>
        </aside>
      )
    case 'cta':
      return (
        <Button
          asChild
          size='lg'
          className='mt-2 h-12 w-fit rounded-full bg-linear-to-r from-sky-500 to-blue-600 px-7 text-base shadow-lg shadow-sky-500/25 hover:opacity-95'
        >
          <Link href={block.href}>
            {block.label} <ArrowRight />
          </Link>
        </Button>
      )
  }
}
