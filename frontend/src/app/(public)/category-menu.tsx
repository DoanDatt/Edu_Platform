'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { getCategoryStyle } from '@/constants/category'
import { cn } from '@/lib/utils'
import { CategoryListItemType } from '@/schemaValidations/category.schema'
import { ChevronDown, LayoutGrid } from 'lucide-react'
import Link from 'next/link'

// Nút "Danh mục" trên header: bấm xổ ra danh sách chủ đề (icon + màu như ô danh mục ở trang chủ, kèm số khóa).
// Danh sách lấy ở Server Component (HeaderCategories trong layout) rồi truyền vào → ở đây chỉ lo phần bấm mở / đóng
export default function CategoryMenu({ categories }: { categories: CategoryListItemType[] }) {
  if (categories.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='rounded-full bg-accent/60 font-medium hover:bg-accent'>
          <LayoutGrid className='text-primary' />
          Danh mục
          <ChevronDown className='text-muted-foreground' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-72 p-2'>
        <DropdownMenuLabel className='text-xs text-muted-foreground'>Khám phá theo chủ đề</DropdownMenuLabel>
        {categories.map((category) => {
          const { Icon, gradient } = getCategoryStyle(category)
          return (
            <DropdownMenuItem key={category.id} asChild className='gap-3 rounded-lg py-2'>
              <Link href={`/courses?categoryId=${category.id}`}>
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br text-white',
                    gradient
                  )}
                >
                  <Icon className='size-4 text-white' />
                </span>
                <span className='flex min-w-0 flex-col'>
                  <span className='truncate font-medium'>{category.name}</span>
                  <span className='text-xs text-muted-foreground'>{category.courseCount} khóa học</span>
                </span>
              </Link>
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className='justify-center rounded-lg font-medium text-primary'>
          <Link href='/courses'>Xem tất cả khóa học</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
