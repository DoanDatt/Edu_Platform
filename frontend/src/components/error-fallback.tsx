'use client'

import StatusScreen from '@/components/status-screen'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

// Giao diện cho error.tsx (Error Boundary của Next): dùng chung cho khu công khai và khu dashboard.
//   retry: Next tải lại dữ liệu của đoạn trang bị lỗi rồi render lại (lỗi tạm thời như mất mạng thì hết)
//   digest: mã băm của lỗi phía server. Bản production không gửi nội dung lỗi xuống trình duyệt (tránh lộ
//           thông tin nhạy cảm), chỉ có mã này → người dùng báo mã, mình tìm đúng dòng log trên Vercel
export default function ErrorFallback({ error, retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations('ErrorPage')
  // Lỗi ném từ Client Component có thể không phải Error → kiểm tra trước khi đọc digest
  const digest = error instanceof Error && 'digest' in error ? String(error.digest) : undefined

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <StatusScreen code='500' title={t('title')} description={t('description')}>
      <Button onClick={() => retry()}>
        <RotateCcw />
        {t('retry')}
      </Button>
      <Button asChild variant='outline'>
        <Link href='/'>{t('home')}</Link>
      </Button>
      {digest && (
        <p className='w-full text-xs text-muted-foreground'>
          {t('errorId')}: <code>{digest}</code>
        </p>
      )}
    </StatusScreen>
  )
}
