import { routing } from '@/i18n/routing'
import type { Metadata } from 'next'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Exo, Geist_Mono, Jost, Plus_Jakarta_Sans } from 'next/font/google'
import '../globals.css'
import AppProvider from '@/components/app-provider'
import ThemeProvider from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'

// Chữ thường theo ngôn ngữ (globals.css dùng biến --font-sans cho class font-sans, gán ở thẻ <html> bên dưới):
//   /en → Jost, đúng font của EduPress
//   /vi → Plus Jakarta Sans: Jost KHÔNG có bộ ký tự tiếng Việt (dấu ạ, ế, ữ... rơi sang font khác, nhìn lệch);
//         Plus Jakarta Sans cùng kiểu chữ hình học như Jost và có đủ tiếng Việt
const jost = Jost({
  variable: '--font-jost',
  subsets: ['latin'],
  weight: ['400', '500', '600']
})

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700']
})

// Tiêu đề (h1–h5, class font-heading): Exo SemiBold đúng như thiết kế EduPress, có tiếng Việt
const exo = Exo({
  variable: '--font-heading',
  subsets: ['vietnamese', 'latin'],
  weight: ['500', '600', '700']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

// Dựng sẵn cả 2 ngôn ngữ lúc build: /... (vi) và /en/...
export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }))

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: hasLocale(routing.locales, locale) ? locale : 'vi', namespace: 'Metadata' })
  return {
    title: {
      default: 'EduPlatform',
      template: '%s | EduPlatform' // trang con đặt title 'Khóa học' → "Khóa học | EduPlatform"
    },
    description: t('description')
  }
}

// Root layout nằm trong [locale]: mỗi ngôn ngữ 1 cây trang, <html lang> đúng theo ngôn ngữ
export default async function RootLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  return (
    // suppressHydrationWarning: next-themes gắn class "dark" lên <html> trước khi React chạy,
    // server không biết trước nên sẽ lệch → tắt cảnh báo riêng cho thẻ này
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${jost.variable} ${plusJakartaSans.variable} ${exo.variable} ${geistMono.variable} h-full antialiased`}
      // Chọn font chữ thường theo ngôn ngữ (xem chú thích ở khai báo jost / plusJakartaSans)
      style={{ '--font-sans': locale === 'en' ? 'var(--font-jost)' : 'var(--font-jakarta)' } as React.CSSProperties}
    >
      <body className='flex min-h-full flex-col'>
        {/* Mặc định giao diện SÁNG (giống đa số web học), người dùng vẫn bật tối bằng nút ở header */}
        {/* NextIntlClientProvider: chuyển bản dịch xuống Client Component (useTranslations ở 'use client') */}
        <NextIntlClientProvider>
          <ThemeProvider attribute='class' defaultTheme='light' disableTransitionOnChange>
            <AppProvider>{children}</AppProvider>
            {/* Nơi hiện thông báo toast (handleErrorApi trong lib/utils dùng nó) */}
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
