import { BlogPost, formatBlogDate, getBlogCategoryName } from '@/content/blog'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { CalendarDays, Clock } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

// Ảnh bìa bài viết tự vẽ (bài viết chưa có ảnh riêng) theo phong cách EduPress:
// nền màu nhạt theo bài (cùng bộ màu với banner EduPress), icon lớn màu cam ở giữa
export function BlogCover({ post, size = 'md' }: { post: BlogPost; size?: 'md' | 'lg' }) {
  const { Icon } = post
  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden bg-linear-to-br',
        post.gradient,
        size === 'lg' ? 'aspect-21/9' : 'aspect-[410/250]'
      )}
    >
      <Icon
        aria-hidden
        className='absolute -right-6 -bottom-8 size-40 -rotate-12 text-[#ff782d]/15'
        strokeWidth={1.5}
      />
      <Icon
        aria-hidden
        className={cn('relative text-[#ff782d]', size === 'lg' ? 'size-24' : 'size-16')}
        strokeWidth={1.5}
      />
    </div>
  )
}

// Thẻ 1 bài viết (trang /blog) theo kiểu thẻ EduPress (cùng khung với thẻ khóa học):
// viền xám bo 20px, ảnh trên, nhãn chuyên mục nền đen ở góc ảnh, tiêu đề, tóm tắt, ngày + thời gian đọc.
// Rê chuột: thẻ nhô lên, có bóng, tiêu đề chuyển cam
export default function BlogCard({ post }: { post: BlogPost }) {
  const t = useTranslations('Blog')
  const locale = useLocale()

  return (
    <Link
      href={`/blog/${post.slug}`}
      className='group flex flex-col overflow-hidden rounded-[20px] border bg-card transition-all duration-300 hover:-translate-y-4 hover:shadow-[0_4px_10px_rgba(0,0,0,0.1)]'
    >
      <div className='relative'>
        <BlogCover post={post} />
        <span className='absolute top-5 left-5 rounded-lg bg-black px-3 py-2 text-base leading-normal font-medium text-white'>
          {getBlogCategoryName(post.category, locale)}
        </span>
      </div>
      <div className='flex flex-1 flex-col gap-3 p-5'>
        <h3 className='line-clamp-2 text-xl leading-[1.2] transition-colors group-hover:text-primary'>{post.title}</h3>
        <p className='line-clamp-3 text-base leading-normal text-muted-foreground'>{post.excerpt}</p>
        <div className='mt-auto flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-4 text-base leading-normal text-muted-foreground'>
          <span className='flex items-center gap-2'>
            <CalendarDays className='size-4 text-primary' />
            {formatBlogDate(post.publishedAt, locale)}
          </span>
          <span className='flex items-center gap-2'>
            <Clock className='size-4 text-primary' />
            {t('minRead', { minutes: post.readingMinutes })}
          </span>
        </div>
      </div>
    </Link>
  )
}
