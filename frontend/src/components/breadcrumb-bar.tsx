import FullBleed from '@/components/full-bleed'
import { Link } from '@/i18n/navigation'
import { ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

export type Crumb = { label: string; href?: string }

// Dải đường dẫn của EduPress: nền xám nhạt tràn ngang, nằm sát dưới header (Homepage > Courses > ...).
// Cấp cuối không có href = trang hiện tại (chữ xám, aria-current). Trang chủ luôn tự thêm ở đầu.
// -mt-6 md:-mt-8: bù khoảng đệm trên của <main> → dải nằm sát header
export default function BreadcrumbBar({ items }: { items: Crumb[] }) {
  const t = useTranslations('Nav')
  const crumbs: Crumb[] = [{ label: t('home'), href: '/' }, ...items]

  return (
    <FullBleed className='-mt-6 bg-secondary md:-mt-8' innerClassName='py-4'>
      <nav aria-label='Breadcrumb'>
        <ol className='flex flex-wrap items-center gap-x-2 gap-y-1 text-base leading-normal'>
          {crumbs.map((crumb, index) => (
            <li key={index} className='flex min-w-0 items-center gap-2'>
              {index > 0 && <ChevronRight aria-hidden className='size-4 shrink-0 text-muted-foreground' />}
              {crumb.href ? (
                <Link href={crumb.href} className='hover:text-primary'>
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current='page' className='line-clamp-1 text-grey'>
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </FullBleed>
  )
}
