import StatusScreen from '@/components/status-screen'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

// 404 của khu công khai: URL không tồn tại ([...rest]/page.tsx) hoặc trang gọi notFound()
// (khóa học / bài blog / đơn hàng không có). Nằm trong layout (public) → còn header, footer, ô tìm kiếm
export default function PublicNotFound() {
  const t = useTranslations('NotFoundPage')
  return (
    <StatusScreen code='404' title={t('title')} description={t('description')}>
      <Button asChild>
        <Link href='/'>{t('home')}</Link>
      </Button>
      <Button asChild variant='outline'>
        <Link href='/courses'>{t('courses')}</Link>
      </Button>
    </StatusScreen>
  )
}
