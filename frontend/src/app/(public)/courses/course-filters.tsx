'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CourseLevel, CourseLevelLabels } from '@/constants/type'
import { CategoryType } from '@/schemaValidations/category.schema'
import { Loader2, Search, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

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

  const search = searchParams.get('search') ?? ''
  const hasFilter = ['search', 'categoryId', 'level', 'price', 'sort'].some((key) => searchParams.has(key))

  // Đổi 1 tham số, giữ các tham số khác; luôn về trang 1 (bộ lọc mới thì trang 5 cũ có thể không còn)
  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== ALL) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    const query = params.toString()
    startTransition(() => router.push(query ? `/courses?${query}` : '/courses'))
  }

  return (
    <div className='flex flex-col gap-3 lg:flex-row lg:items-center'>
      {/* Tìm kiếm: chỉ gửi khi bấm Enter / nút, không gọi API theo từng ký tự gõ */}
      <form
        className='relative flex-1'
        onSubmit={(e) => {
          e.preventDefault()
          updateParam('search', String(new FormData(e.currentTarget).get('search') ?? '').trim())
        }}
      >
        <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
        {/* key={search}: URL đổi (ví dụ bấm "Xóa bộ lọc") thì ô nhập hiện lại đúng giá trị trên URL */}
        <Input
          key={search}
          name='search'
          defaultValue={search}
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
