'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

// Bọc next-themes: lưu lựa chọn sáng / tối vào localStorage,
// gắn class "dark" lên thẻ <html> → các class dark:... trong Tailwind có hiệu lực
export default function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
