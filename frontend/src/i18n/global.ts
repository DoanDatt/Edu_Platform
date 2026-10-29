import { routing } from '@/i18n/routing'
import messages from '../../messages/vi.json'

// Kiểu cho next-intl: gõ sai khóa dịch (t('Header.serch')) hoặc sai ngôn ngữ là TypeScript báo lỗi ngay.
// Lấy vi.json làm chuẩn: en.json phải có đủ các khóa giống vậy
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number]
    Messages: typeof messages
  }
}
