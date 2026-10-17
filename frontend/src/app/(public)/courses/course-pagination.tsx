import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

type SearchParams = Record<string, string | string[] | undefined>

export default function CoursePagination({
  page,
  totalPages,
  searchParams
}: {
  page: number
  totalPages: number
  searchParams: SearchParams // tham số đang có trên URL, để giữ bộ lọc khi chuyển trang
}) {
  if (totalPages <= 1) return null

  // Link tới trang n: GIỮ NGUYÊN mọi bộ lọc trên URL, chỉ đổi page
  //   URL: /courses?level=BEGINNER&page=1 → hrefFor(2) = /courses?level=BEGINNER&page=2
  const hrefFor = (n: number) => {
    const params = new URLSearchParams()

    // 1. Chép lại các tham số đang có, TRỪ page cũ (không thì URL có 2 page: ?page=1&page=2)
    //    Chỉ lấy giá trị là chuỗi: bỏ undefined và mảng (?level=A&level=B)
    Object.entries(searchParams).forEach(([key, value]) => {
      if (typeof value === 'string' && key !== 'page') params.set(key, value)
    })

    // 2. Đặt page mới. Trang 1 thì không thêm → URL gọn (/courses thay vì /courses?page=1)
    if (n > 1) params.set('page', String(n))

    // 3. Ghép thành link. Không còn tham số nào → '/courses' (không để dấu ? thừa)
    const query = params.toString()
    return query ? `/courses?${query}` : '/courses'
  }
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
