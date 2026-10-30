import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

export type SearchParams = Record<string, string | string[] | undefined>

// Phân trang bằng LINK, dùng chung cho mọi danh sách có bộ lọc trên URL.
// Ban đầu viết riêng cho /courses (cứng '/courses'). Bảng khóa học của giảng viên là chỗ dùng thứ 2
// → tách ra đây, phần khác nhau (đường dẫn) đưa vào prop pathname
export default function PaginationLinks({
  pathname,
  page,
  totalPages,
  searchParams
}: {
  pathname: string // '/courses', '/instructor/courses'...
  page: number
  totalPages: number
  searchParams: SearchParams // tham số đang có trên URL, để giữ bộ lọc khi chuyển trang
}) {
  const t = useTranslations('Common')
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

    // 3. Ghép thành link. Không còn tham số nào → chỉ pathname (không để dấu ? thừa)
    const query = params.toString()
    return query ? `${pathname}?${query}` : pathname
  }
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    // Kiểu phân trang của EduPress: ô tròn 40px, trang đang xem nền đen chữ trắng, mũi tên 2 đầu viền xám
    <nav aria-label={t('pagination')} className='flex items-center justify-center gap-2.5'>
      <Button
        asChild
        variant={'outline'}
        size={'icon'}
        className={cn('size-10 rounded-full', page <= 1 && 'pointer-events-none opacity-50')}
      >
        <Link href={hrefFor(page - 1)} aria-label={t('previousPage')}>
          <ChevronLeft />
        </Link>
      </Button>
      {pages.map((n) => (
        <Button
          key={n}
          asChild
          variant={n === page ? 'default' : 'ghost'}
          size={'icon'}
          className={cn('size-10 rounded-full text-base', n === page && 'bg-foreground text-background hover:bg-foreground/85')}
        >
          <Link href={hrefFor(n)} aria-current={n === page ? 'page' : undefined}>
            {n}
          </Link>
        </Button>
      ))}
      <Button
        asChild
        variant={'outline'}
        size={'icon'}
        className={cn('size-10 rounded-full', page >= totalPages && 'pointer-events-none opacity-50')}
      >
        <Link href={hrefFor(page + 1)} aria-label={t('nextPage')}>
          <ChevronRight />
        </Link>
      </Button>
    </nav>
  )
}
