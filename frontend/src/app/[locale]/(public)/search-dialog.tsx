'use client'

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CategoryListItemType } from '@/schemaValidations/category.schema'
import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import HeaderSearch from './header-search'

// Nút tìm kiếm tròn viền cam ở góc phải header (EduPress: 48px, viền 2px màu primary).
// Bấm → hộp thoại có ô tìm kiếm đầy đủ (chọn danh mục + từ khóa), gửi form thì đóng hộp thoại
export default function SearchDialog({ categories }: { categories?: CategoryListItemType[] }) {
  const t = useTranslations('Header')
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type='button'
          aria-label={t('search')}
          className='flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-primary text-primary transition-colors hover:bg-primary hover:text-primary-foreground sm:size-12'
        >
          <Search className='size-5' />
        </button>
      </DialogTrigger>
      {/* top-24: hộp thoại nằm gần đầu trang (ngay dưới header) thay vì giữa màn hình, như ô tìm kiếm thường gặp */}
      <DialogContent className='top-24 translate-y-0 gap-4 sm:max-w-2xl'>
        <DialogTitle className='text-xl'>{t('searchLabel')}</DialogTitle>
        <DialogDescription className='sr-only'>{t('searchPlaceholder')}</DialogDescription>
        <div onSubmit={() => setOpen(false)}>
          <HeaderSearch categories={categories} autoFocus />
        </div>
      </DialogContent>
    </Dialog>
  )
}
