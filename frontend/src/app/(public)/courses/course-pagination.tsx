import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function CoursePagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null

  const hrefFor = (n: number) => (n === 1 ? '/courses' : `/courses?page=${n}`)
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <nav aria-label='Phân trang' className='flex items-center justify-center gap-1'>
      <Button asChild variant={'outline'} size={'icon'} className={page <= 1 ? 'pointer-events-none opacity-50' : ''}>
        <Link href={hrefFor(page - 1)} aria-label='Trang trước'>
          <ChevronLeft />
        </Link>
      </Button>
      {pages.map((n) => (
        <Button key={n} asChild variant={n === page ? 'default' : 'outline'} size={'icon'}>
          <Link href={hrefFor(n)} aria-current={n === page ? 'page' : undefined}>
            {n}
          </Link>
        </Button>
      ))}
      <Button
        asChild
        variant={'outline'}
        size={'icon'}
        className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
      >
        <Link href={hrefFor(page + 1)} aria-label='Trang sau'>
          <ChevronRight />
        </Link>
      </Button>
    </nav>
  )
}
