'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useRouter } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { Languages } from 'lucide-react'
import { Locale, useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'

// Tên ngôn ngữ luôn viết bằng chính ngôn ngữ đó: người không đọc được tiếng Việt vẫn nhận ra "English"
const localeNames: Record<Locale, string> = { vi: 'Tiếng Việt', en: 'English' }

// Nút đổi ngôn ngữ trên header: chọn ngôn ngữ → ở nguyên trang hiện tại (giữ cả ?query, #hash), chỉ đổi tiền tố URL.
// Đọc đường dẫn từ window.location lúc bấm (không dùng usePathname / useSearchParams):
// header có mặt ở mọi trang, dùng 2 hook đó thì phải bọc Suspense khắp nơi
export default function LocaleSwitcher() {
  const t = useTranslations('LocaleSwitcher')
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const switchTo = (next: string) => {
    if (next === locale || !routing.locales.includes(next as Locale)) return
    const { pathname, search, hash } = window.location
    // Bỏ tiền tố của ngôn ngữ hiện tại: '/en/courses' → '/courses' (tiếng Việt vốn không có tiền tố)
    const path = locale === routing.defaultLocale ? pathname : pathname.replace(`/${locale}`, '') || '/'
    startTransition(() => router.replace(path + search + hash, { locale: next as Locale, scroll: false }))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          className='gap-1.5 px-2 font-semibold uppercase'
          aria-label={t('label')}
          disabled={isPending}
        >
          <Languages className='size-4' />
          {locale}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-40'>
        <DropdownMenuRadioGroup value={locale} onValueChange={switchTo}>
          {routing.locales.map((item) => (
            <DropdownMenuRadioItem key={item} value={item}>
              {localeNames[item]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
