'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CategoryType } from '@/schemaValidations/category.schema'
import { Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function CourseFilters({ categories }: { categories: CategoryType[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchText, setSearchText] = useState(searchParams.get('search') ?? '')

  // Đổi 1 bộ lọc trên URL, giữ nguyên các bộ lọc khác
  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    // Chuỗi rỗng (xóa hết chữ trong ô tìm kiếm) hoặc 'all' (chọn "Tất cả...") → bỏ bộ lọc này khỏi URL
    if (!value || value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete('page') // đổi bộ lọc về trang 1
    const query = params.toString() // ghep chuoi
    router.push(query ? `/courses?${query}` : '/courses')
  }

  // Bấm Enter trong ô tìm kiếm = gửi form → đưa chữ đã gõ lên URL
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault() // chặn form tải lại cả trang
    updateParam('search', searchText.trim()) // trim: bỏ khoảng trắng 2 đầu
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
    </div>
  )
}
