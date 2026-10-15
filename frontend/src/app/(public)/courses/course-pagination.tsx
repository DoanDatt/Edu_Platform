import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

type SearchParams = Record<string, string | string[] | undefined>

// Các số trang cần hiện, rút gọn bằng '...': trang 6/12 → 1 ... 5 6 7 ... 12
const getPageItems = (page: number, totalPages: number): (number | '...')[] => {
  const items: (number | '...')[] = []
  for (let p = 1; p <= totalPages; p++) {
    const nearCurrent = Math.abs(p - page) <= 1
    if (p === 1 || p === totalPages || nearCurrent) {
      items.push(p)
    } else if (items[items.length - 1] !== '...') {
      items.push('...')
    }
  }
  return items
}

// Phân trang bằng LINK (không phải state): giữ nguyên bộ lọc trên URL, chỉ đổi ?page=
// → render được ở server, bấm Back quay lại trang trước, chia sẻ link đúng trang
export default function CoursePagination({
  page,
  totalPages,
  searchParams
}: {
  page: number
  totalPages: number
  searchParams: SearchParams
}) {
  if (totalPages <= 1) return null

  const hrefFor = (target: number) => {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([key, value]) => {
      if (typeof value === 'string' && key !== 'page') params.set(key, value)
    })
    if (target > 1) params.set('page', String(target))
    const query = params.toString()
    return query ? `/courses?${query}` : '/courses'
  }

  return (
    <nav aria-label='Phân trang' className='flex items-center justify-center gap-1'>
      <Button asChild variant='outline' size='icon' className={page <= 1 ? 'pointer-events-none opacity-50' : ''}>
        <Link href={hrefFor(page - 1)} aria-label='Trang trước' aria-disabled={page <= 1}>
          <ChevronLeft />
        </Link>
      </Button>

      {getPageItems(page, totalPages).map((item, index) =>
        item === '...' ? (
          <span key={`dots-${index}`} className='px-2 text-muted-foreground'>
            ...
          </span>
        ) : (
          <Button key={item} asChild variant={item === page ? 'default' : 'outline'} size='icon'>
            <Link href={hrefFor(item)} aria-current={item === page ? 'page' : undefined}>
              {item}
            </Link>
          </Button>
        )
      )}

      <Button
        asChild
        variant='outline'
        size='icon'
        className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
      >
        <Link href={hrefFor(page + 1)} aria-label='Trang sau' aria-disabled={page >= totalPages}>
          <ChevronRight />
        </Link>
      </Button>
    </nav>
  )
}
