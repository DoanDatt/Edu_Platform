'use client'

import { cn } from '@/lib/utils'
import { CategoryListItemType } from '@/schemaValidations/category.schema'
import { ChevronDown, Search } from 'lucide-react'
import { FormEvent } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

// Ô tìm kiếm trên header: [Tất cả danh mục ▾ | Tìm khóa học... 🔍] → /courses?categoryId=..&search=..
// Trang /courses đọc bộ lọc trên URL để lọc, ô tìm kiếm ở đó cũng tự điền theo URL.
// Tự dựng URL thay vì để form GET gửi thẳng: form gửi cả trường RỖNG (?categoryId=&search=react),
// mà categoryId rỗng không hợp lệ → trang /courses bỏ qua CẢ bộ lọc, mất luôn từ khóa → phải bỏ trường rỗng.
// categories: không truyền (menu trượt trên điện thoại) → chỉ có ô nhập, không có ô chọn danh mục
export default function HeaderSearch({
  className,
  categories
}: {
  className?: string
  categories?: CategoryListItemType[]
}) {
  const t = useTranslations('Header')
  const router = useRouter()

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const params = new URLSearchParams()
    for (const [key, value] of new FormData(e.currentTarget)) {
      if (typeof value === 'string' && value.trim()) params.set(key, value.trim())
    }
    const query = params.toString()
    router.push(query ? `/courses?${query}` : '/courses')
  }

  return (
    <form
      role='search'
      onSubmit={onSubmit}
      className={cn(
        'flex h-11 items-center rounded-full border bg-muted/60 transition-colors focus-within:border-primary/40 focus-within:bg-background',
        className
      )}
    >
      {categories && categories.length > 0 && (
        <>
          <div className='relative hidden shrink-0 lg:block'>
            <select
              name='categoryId'
              aria-label={t('filterByCategory')}
              defaultValue=''
              className='h-11 max-w-44 cursor-pointer appearance-none truncate rounded-l-full bg-transparent pr-8 pl-5 text-sm text-muted-foreground outline-none'
            >
              <option value=''>{t('allCategories')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <ChevronDown className='pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground' />
          </div>
          <span aria-hidden className='hidden h-6 w-px shrink-0 bg-border lg:block' />
        </>
      )}
      <input
        name='search'
        type='search'
        placeholder={t('searchPlaceholder')}
        aria-label={t('searchLabel')}
        className='h-full min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground'
      />
      <button
        type='submit'
        aria-label={t('search')}
        className='mr-1 flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground'
      >
        <Search className='size-4' />
      </button>
    </form>
  )
}
