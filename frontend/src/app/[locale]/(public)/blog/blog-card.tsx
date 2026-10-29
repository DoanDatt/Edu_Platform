import Waves from '@/components/waves'
import { BlogPost, blogCategories, formatBlogDate } from '@/content/blog'
import { cn } from '@/lib/utils'
import { ArrowRight, CalendarDays, Clock } from 'lucide-react'
import { Link } from '@/i18n/navigation'

// Ảnh bìa bài viết tự vẽ: gradient theo bài + sóng + icon lớn mờ (bài viết chưa có ảnh riêng)
export function BlogCover({ post, size = 'md' }: { post: BlogPost; size?: 'md' | 'lg' }) {
  const { Icon } = post
  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden bg-linear-to-br text-white',
        post.gradient,
        size === 'lg' ? 'aspect-21/9' : 'aspect-video'
      )}
    >
      <div aria-hidden className='absolute -top-1/3 -right-1/4 size-2/3 rounded-full bg-white/20 blur-2xl' />
      <Waves />
      <Icon
        aria-hidden
        className={cn('relative text-white/90 drop-shadow-lg', size === 'lg' ? 'size-24' : 'size-16')}
      />
    </div>
  )
}

// Thẻ 1 bài viết (trang /blog): ảnh bìa lọt lòng, chuyên mục, tiêu đề, tóm tắt, ngày + thời gian đọc
export default function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className='group flex flex-col rounded-3xl border bg-card p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10'
    >
      <div className='overflow-hidden rounded-2xl'>
        <div className='transition-transform duration-500 group-hover:scale-105'>
          <BlogCover post={post} />
        </div>
      </div>
      <div className='flex flex-1 flex-col gap-2.5 px-1.5 pt-4 pb-1'>
        <span className='w-fit rounded-full bg-highlight/10 px-2.5 py-0.5 text-xs font-semibold text-highlight'>
          {blogCategories[post.category]}
        </span>
        <h3 className='line-clamp-2 font-heading text-lg leading-snug font-semibold transition-colors group-hover:text-primary'>
          {post.title}
        </h3>
        <p className='line-clamp-3 text-sm text-muted-foreground'>{post.excerpt}</p>
        <div className='mt-auto flex items-center justify-between gap-3 border-t pt-3 text-xs text-muted-foreground'>
          <span className='flex items-center gap-3'>
            <span className='flex items-center gap-1'>
              <CalendarDays className='size-3.5' />
              {formatBlogDate(post.publishedAt)}
            </span>
            <span className='flex items-center gap-1'>
              <Clock className='size-3.5' />
              {post.readingMinutes} phút đọc
            </span>
          </span>
          <span className='flex items-center gap-1 text-sm font-medium text-primary'>
            Đọc <ArrowRight className='size-4 transition-transform group-hover:translate-x-0.5' />
          </span>
        </div>
      </div>
    </Link>
  )
}
