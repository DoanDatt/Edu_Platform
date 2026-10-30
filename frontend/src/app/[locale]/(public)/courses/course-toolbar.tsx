'use client'

import { usePathname, useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { LayoutGrid, List, Search } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

// Ngừng gõ bao lâu (mili giây) thì tự tìm
const SEARCH_DEBOUNCE_MS = 400

// Đầu danh sách theo Figma EduPress (Course Listing): "All Courses" bên trái;
// bên phải ô tìm kiếm gạch chân + 2 nút xem dạng lưới / danh sách (đang chọn: màu cam).
// Chế độ xem nằm trên URL (?view=grid), mặc định danh sách như Figma
export default function CourseToolbar() {
  const t = useTranslations('Courses')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const view = searchParams.get('view') === 'grid' ? 'grid' : 'list'

  // ===== Ô tìm kiếm: 3 giá trị cần phân biệt =====
  // urlSearch:  chữ ĐANG NẰM TRÊN URL (server đọc cái này để lọc)
  // searchText: chữ người dùng ĐANG GÕ trong ô (chưa chắc đã lên URL)
  // lastPushed: chữ MÌNH vừa tự đẩy lên URL gần nhất (do debounce hoặc Enter)
  const urlSearch = searchParams.get('search') ?? ''
  const [searchText, setSearchText] = useState(urlSearch)
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch)
  const [lastPushed, setLastPushed] = useState(urlSearch)

  // URL đổi → xem ai làm đổi:
  //   - DO MÌNH vừa đẩy lên (urlSearch === lastPushed): KHÔNG đụng vào ô nhập,
  //     vì người dùng có thể đã gõ thêm chữ trong lúc chờ → ghi đè là mất chữ đang gõ
  //   - DO BÊN NGOÀI (Back, Forward, bỏ bộ lọc): đưa ô nhập về đúng URL
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch)
    if (urlSearch !== lastPushed) {
      setSearchText(urlSearch)
      setLastPushed(urlSearch)
    }
  }

  // Đổi 1 tham số trên URL, giữ nguyên các tham số khác. resetPage: đổi bộ lọc thì về trang 1
  const updateParam = useCallback(
    (key: string, value: string, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      if (resetPage) params.delete('page')
      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  // Đẩy chữ tìm kiếm lên URL, NHỚ LẠI là mình vừa đẩy (để khối if ở trên không ghi đè ô nhập)
  const pushSearch = useCallback(
    (value: string) => {
      setLastPushed(value)
      updateParam('search', value)
    },
    [updateParam]
  )

  // ===== Debounce: ngừng gõ SEARCH_DEBOUNCE_MS mới tự tìm =====
  // Mỗi lần gõ 1 ký tự, searchText đổi → effect chạy lại: hàm dọn dẹp của lần trước HỦY hẹn giờ cũ,
  // rồi đặt hẹn giờ mới → gõ liên tục thì hẹn giờ cứ bị hủy; ngừng gõ đủ 400ms mới chạy được
  useEffect(() => {
    const value = searchText.trim()
    if (value === urlSearch) return
    const timer = setTimeout(() => pushSearch(value), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchText, urlSearch, pushSearch])

  // Bấm Enter / nút kính lúp: tìm NGAY, không cần đợi 400ms
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const value = searchText.trim()
    if (value !== urlSearch) pushSearch(value)
  }

  const viewButton = (mode: 'grid' | 'list', Icon: typeof List, label: string) => (
    <button
      type='button'
      onClick={() => updateParam('view', mode === 'list' ? '' : mode, false)}
      aria-label={label}
      aria-pressed={view === mode}
      className={cn('transition-colors hover:text-primary', view === mode ? 'text-primary' : 'text-foreground')}
    >
      <Icon className='size-5' />
    </button>
  )

  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
      <h1 className='text-[28px] leading-[1.2] capitalize md:text-[32px]'>{t('allCourses')}</h1>
      <div className='flex items-center gap-5'>
        <form onSubmit={handleSubmit} className='flex flex-1 items-center border-b border-grey sm:w-[270px] sm:flex-none'>
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            className='h-10 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-grey'
          />
          <button type='submit' aria-label={t('searchPlaceholder')} className='hover:text-primary'>
            <Search className='size-5' />
          </button>
        </form>
        {viewButton('grid', LayoutGrid, t('gridView'))}
        {viewButton('list', List, t('listView'))}
      </div>
    </div>
  )
}
