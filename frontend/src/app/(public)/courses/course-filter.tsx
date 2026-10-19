'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CategoryType } from '@/schemaValidations/category.schema'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

// Ngừng gõ bao lâu (mili giây) thì tự tìm
const SEARCH_DEBOUNCE_MS = 400

// Các key được coi là "bộ lọc": có ít nhất 1 cái trên URL thì hiện nút "Xóa bộ lọc"
const FILTER_KEYS = ['search', 'categoryId', 'level', 'price', 'sort']

export default function CourseFilters({ categories }: { categories: CategoryType[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

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
  //   - DO BÊN NGOÀI (Back, Forward, nút "Xóa bộ lọc"): đưa ô nhập về đúng URL
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch)
    if (urlSearch !== lastPushed) {
      setSearchText(urlSearch)
      setLastPushed(urlSearch)
    }
  }

  // Đổi 1 bộ lọc trên URL, giữ nguyên các bộ lọc khác.
  // useCallback: giữ nguyên hàm giữa các lần render (chỉ tạo lại khi router / searchParams đổi),
  // vì useEffect debounce bên dưới để hàm này trong danh sách phụ thuộc
  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      // Chuỗi rỗng (xóa hết chữ trong ô tìm kiếm) hoặc 'all' (chọn "Tất cả...") → bỏ bộ lọc này khỏi URL
      if (!value || value === 'all') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      params.delete('page') // đổi bộ lọc về trang 1
      const query = params.toString()
      router.push(query ? `/courses?${query}` : '/courses')
    },
    [router, searchParams]
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
  // Mỗi lần gõ 1 ký tự, searchText đổi → effect chạy lại:
  //   1. Hàm dọn dẹp (return) của lần trước chạy TRƯỚC → clearTimeout HỦY hẹn giờ cũ
  //   2. Đặt hẹn giờ mới 400ms
  // → Gõ liên tục thì hẹn giờ cứ bị hủy; chỉ khi ngừng gõ đủ 400ms nó mới chạy được
  useEffect(() => {
    const value = searchText.trim()
    if (value === urlSearch) return // URL đã đúng rồi, không cần đẩy
    const timer = setTimeout(() => pushSearch(value), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchText, urlSearch, pushSearch])

  // Bấm Enter: tìm NGAY, không cần đợi 400ms
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault() // chặn form tải lại cả trang
    const value = searchText.trim()
    if (value !== urlSearch) pushSearch(value)
  }

  // ===== Xóa bộ lọc =====
  const hasFilter = FILTER_KEYS.some((key) => searchParams.has(key))

  const clearFilters = () => {
    // Xóa chữ trong ô ngay, không chờ URL đổi (phòng trường hợp đang gõ dở, chưa kịp đẩy lên URL)
    setSearchText('')
    setLastPushed('')
    router.push('/courses')
  }

  return (
    <div className='flex flex-col gap-3 lg:flex-row lg:items-center'>
      <form className='relative flex-1' onSubmit={handleSubmit}>
        <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder='Tìm khóa học'
          className='h-10 pl-9'
          aria-label='Tìm khóa học'
        />
      </form>

      {/* Điện thoại: 2 cột, máy tính bảng: 4 cột, máy tính: nằm cùng hàng với ô tìm kiếm */}
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex'>
        <Select value={searchParams.get('categoryId') ?? 'all'} onValueChange={(v) => updateParam('categoryId', v)}>
          <SelectTrigger className='h-10 w-full lg:w-44' aria-label='Danh mục'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả danh mục</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={searchParams.get('level') ?? 'all'} onValueChange={(v) => updateParam('level', v)}>
          <SelectTrigger className='h-10 w-full lg:w-40' aria-label='Trình độ'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Mọi trình độ</SelectItem>
            <SelectItem value='BEGINNER'>Cơ bản</SelectItem>
            <SelectItem value='INTERMEDIATE'>Trung cấp</SelectItem>
            <SelectItem value='ADVANCED'>Nâng cao</SelectItem>
          </SelectContent>
        </Select>

        <Select value={searchParams.get('price') ?? 'all'} onValueChange={(v) => updateParam('price', v)}>
          <SelectTrigger className='h-10 w-full lg:w-36' aria-label='Giá'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Mọi mức giá</SelectItem>
            <SelectItem value='free'>Miễn phí</SelectItem>
            <SelectItem value='paid'>Có phí</SelectItem>
          </SelectContent>
        </Select>

        <Select value={searchParams.get('sort') ?? 'newest'} onValueChange={(v) => updateParam('sort', v)}>
          <SelectTrigger className='h-10 w-full lg:w-40' aria-label='Sắp xếp'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='newest'>Mới nhất</SelectItem>
            <SelectItem value='popular'>Nhiều học viên</SelectItem>
            <SelectItem value='price_asc'>Giá tăng dần</SelectItem>
            <SelectItem value='price_desc'>Giá giảm dần</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chỉ hiện khi đang có bộ lọc nào đó trên URL */}
      {hasFilter && (
        <Button variant='ghost' className='h-10 self-start lg:self-auto' onClick={clearFilters}>
          <X />
          Xóa bộ lọc
        </Button>
      )}
    </div>
  )
}
