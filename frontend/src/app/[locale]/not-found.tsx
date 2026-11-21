import StatusScreen from '@/components/status-screen'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

// 404 của khu dashboard: trang admin / giảng viên gọi notFound() (vd id khóa học không hợp lệ).
// Khu này không có header công khai → tự căn giữa cả màn hình
export default function LocaleNotFound() {
  const t = useTranslations('NotFoundPage')
  return (
    <main className='flex min-h-screen flex-col px-4'>
      <StatusScreen code='404' title={t('title')} description={t('description')}>
        <Button asChild>
          <Link href='/'>{t('home')}</Link>
        </Button>
      </StatusScreen>
    </main>
  )
}
