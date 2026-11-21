import envConfig from '@/config'
import type { MetadataRoute } from 'next'

// /robots.txt: cho phép Google đọc trang công khai, chặn các khu cần đăng nhập (không có gì để đưa lên tìm kiếm).
// Ghi cả bản có tiền tố /vi vì tiếng Việt nằm dưới /vi/...
const PRIVATE_PATHS = [
  '/admin',
  '/instructor',
  '/learn',
  '/my-courses',
  '/my-orders',
  '/checkout',
  '/profile',
  '/logout'
]

export default function robots(): MetadataRoute.Robots {
  const baseUrl = envConfig.NEXT_PUBLIC_URL.replace(/\/$/, '')
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', ...PRIVATE_PATHS, ...PRIVATE_PATHS.map((path) => `/vi${path}`)]
    },
    sitemap: `${baseUrl}/sitemap.xml`
  }
}
