'use client'

import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'

export default function DarkModeToggle() {
  const t = useTranslations('Header')
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      variant='ghost'
      size='icon'
      className='relative'
      aria-label={t('toggleTheme')}
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      {/* Vẽ cả 2 icon, CSS (dark:) quyết định cái nào hiện.
          Không dùng if (theme === 'dark') vì server không biết theme → lệch giao diện khi hydrate */}
      <Sun className='size-5 scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90' />
      <Moon className='absolute size-5 scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0' />
    </Button>
  )
}
