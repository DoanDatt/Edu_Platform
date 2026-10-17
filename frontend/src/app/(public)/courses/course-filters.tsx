'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CourseLevel, CourseLevelLabels } from '@/constants/type'
import { CategoryType } from '@/schemaValidations/category.schema'
import { Loader2, Search, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'

// Ngừng gõ bao lâu thì tự tìm (mili giây)
const SEARCH_DEBOUNCE_MS = 400

// Select của Radix không cho value rỗng '' → dùng 'all' nghĩa là "không lọc"
const ALL = 'all'

const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'popular', label: 'Nhiều học viên' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' }
]

// Bộ lọc KHÔNG lưu state riêng: mọi lựa chọn nằm trên URL (?search=&level=...).
// Đổi bộ lọc = đổi URL → server đọc URL mới và trả danh sách mới.
// Nhờ vậy: chia sẻ link giữ nguyên bộ lọc, bấm Back quay lại bộ lọc trước
export default function CourseFilters({ categories }: { categories: CategoryType[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  // isPending: đang chờ server trả trang mới → hiện vòng xoay
  const [isPending, startTransition] = useTransition()

  const hasFilter = ['search', 'categoryId', 'level', 'price', 'sort'].some((key) => searchParams.has(key))

  // Đổi 1 tham số, giữ các tham số khác; luôn về trang 1 (bộ lọc mới thì trang 5 cũ có thể không còn).
  // useCallback: giữ nguyên hàm giữa các lần render, vì useEffect tìm kiếm bên dưới phụ thuộc vào nó
  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== ALL) params.set(key, value)
      else params.delete(key)
      params.delete('page')
      const query = params.toString()
      startTransition(() => router.push(query ? `/courses?${query}` : '/courses'))
    },
    [router, searchParams]
  )

  // ===== Tìm kiếm tự động (debounce) =====
  // urlSearch: giá trị search ĐANG NẰM TRÊN URL (nguồn chính thức, server đọc cái này)
  // searchText: chữ người dùng ĐANG GÕ trong ô (chưa chắc đã lên URL)
  const urlSearch = searchParams.get('search') ?? ''
  const [searchText, setSearchText] = useState(urlSearch)
  // Giá trị mình đã tự đẩy lên URL gần nhất, để phân biệt URL đổi do MÌNH (vừa gõ)
  // hay do BÊN NGOÀI (bấm "Xóa bộ lọc", nút Back của trình duyệt)
  const [lastPushed, setLastPushed] = useState(urlSearch)
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch)

  // URL đổi do bên ngoài → cập nhật ô nhập cho khớp URL.
  // URL đổi do chính mình vừa đẩy lên → KHÔNG đụng vào ô nhập, nếu không chữ đang gõ tiếp sẽ bị ghi đè.
  // Cập nhật state ngay trong lúc render khi giá trị đầu vào đổi: cách React khuyên dùng thay cho useEffect
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch)
    if (urlSearch !== lastPushed) {
      setSearchText(urlSearch)
      setLastPushed(urlSearch)
    }
  }

  const pushSearch = useCallback(
    (value: string) => {
      setLastPushed(value)
      updateParam('search', value)
    },
    [updateParam]
  )

  // Gõ xong, ngừng SEARCH_DEBOUNCE_MS mới đẩy lên URL. Mỗi lần gõ thêm 1 ký tự, effect chạy lại:
  // hàm dọn dẹp clearTimeout HỦY hẹn giờ cũ → chỉ lần gõ CUỐI CÙNG mới thật sự gọi API
  useEffect(() => {
    const value = searchText.trim()
    if (value === urlSearch) return // URL đã đúng rồi, không cần làm gì
    const timer = setTimeout(() => pushSearch(value), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchText, urlSearch, pushSearch])

  return (
    <div className='flex flex-col gap-3 lg:flex-row lg:items-center'>
      {/* Tự tìm sau khi ngừng gõ; bấm Enter thì tìm ngay, không cần đợi */}
      <form
        className='relative flex-1'
        onSubmit={(e) => {
          e.preventDefault()
          const value = searchText.trim()
          if (value !== urlSearch) pushSearch(value)
        }}
      >
        <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          name='search'
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder='Tìm khóa học, ví dụ: React'
          className='h-10 pr-10 pl-9'
          aria-label='Tìm khóa học'
        />
        <span className='absolute top-1/2 right-3 -translate-y-1/2'>
          {isPending && <Loader2 className='size-4 animate-spin text-muted-foreground' />}
        </span>
      </form>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex'>
        <Select value={searchParams.get('categoryId') ?? ALL} onValueChange={(v) => updateParam('categoryId', v)}>
          <SelectTrigger className='h-10 w-full lg:w-44' aria-label='Danh mục'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả danh mục</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={searchParams.get('level') ?? ALL} onValueChange={(v) => updateParam('level', v)}>
          <SelectTrigger className='h-10 w-full lg:w-40' aria-label='Trình độ'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Mọi trình độ</SelectItem>
            {Object.values(CourseLevel)
              .filter((level) => level !== CourseLevel.ALL_LEVELS)
              .map((level) => (
                <SelectItem key={level} value={level}>
                  {CourseLevelLabels[level]}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Select value={searchParams.get('price') ?? ALL} onValueChange={(v) => updateParam('price', v)}>
          <SelectTrigger className='h-10 w-full lg:w-36' aria-label='Giá'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Mọi mức giá</SelectItem>
            <SelectItem value='free'>Miễn phí</SelectItem>
            <SelectItem value='paid'>Có phí</SelectItem>
          </SelectContent>
        </Select>

        <Select value={searchParams.get('sort') ?? 'newest'} onValueChange={(v) => updateParam('sort', v)}>
          <SelectTrigger className='h-10 w-full lg:w-40' aria-label='Sắp xếp'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilter && (
        <Button
          variant='ghost'
          className='h-10 self-start lg:self-auto'
          onClick={() => startTransition(() => router.push('/courses'))}
        >
          <X />
          Xóa bộ lọc
        </Button>
      )}
    </div>
  )
}
