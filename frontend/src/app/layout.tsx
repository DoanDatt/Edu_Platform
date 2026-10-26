import type { Metadata } from 'next'
import { Be_Vietnam_Pro, Geist_Mono } from 'next/font/google'
import './globals.css'
import AppProvider from '@/components/app-provider'
import ThemeProvider from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'

// Be Vietnam Pro: font thiết kế cho tiếng Việt, dấu (ạ, ế, ữ...) hiển thị đẹp.
// Geist (font mặc định của create-next-app) không có bộ ký tự tiếng Việt
// variable '--font-sans': globals.css dùng biến này cho class font-sans
const beVietnamPro = Be_Vietnam_Pro({
  variable: '--font-sans',
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: {
    default: 'EduPlatform',
    template: '%s | EduPlatform' // trang con đặt title 'Khóa học' → "Khóa học | EduPlatform"
  },
  description: 'Nền tảng học trực tuyến: lập trình, thiết kế, marketing, khoa học dữ liệu'
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // suppressHydrationWarning: next-themes gắn class "dark" lên <html> trước khi React chạy,
    // server không biết trước nên sẽ lệch → tắt cảnh báo riêng cho thẻ này
    <html
      lang='vi'
      suppressHydrationWarning
      className={`${beVietnamPro.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className='flex min-h-full flex-col'>
        {/* Mặc định giao diện SÁNG (giống đa số web học), người dùng vẫn bật tối bằng nút ở header */}
        <ThemeProvider attribute='class' defaultTheme='light' disableTransitionOnChange>
          <AppProvider>{children}</AppProvider>
          {/* Nơi hiện thông báo toast (handleErrorApi trong lib/utils dùng nó) */}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
