'use client'

import { ArrowUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

// Nút tròn đen góc phải dưới (EduPress: 60px, mũi tên lên). Chỉ hiện khi đã cuộn xuống quá 1 màn hình
export default function BackToTop() {
  const t = useTranslations('Footer')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      type='button'
      aria-label={t('backToTop')}
      // Ẩn bằng opacity + invisible (không bỏ khỏi DOM) để có hiệu ứng mờ dần
      className={`fixed right-6 bottom-6 z-30 flex size-14 items-center justify-center rounded-full bg-neutral-950 text-white shadow-lg transition-all hover:bg-primary dark:bg-white dark:text-neutral-950 dark:hover:bg-primary dark:hover:text-white ${visible ? 'visible opacity-100' : 'invisible translate-y-2 opacity-0'}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <ArrowUp className='size-6' />
    </button>
  )
}
