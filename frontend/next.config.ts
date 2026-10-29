import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // <Image> của Next chỉ tải ảnh từ những địa chỉ được khai báo ở đây
  images: {
    remotePatterns: [
      // Ảnh mẫu của seed:demo. picsum.photos chuyển hướng sang fastly.picsum.photos
      new URL('https://picsum.photos/**'),
      new URL('https://**.picsum.photos/**'),
      // Ảnh upload lên backend (dev). Deploy thật thì thêm tên miền của API vào đây
      new URL('http://localhost:4000/uploads/**'),
      // Ảnh upload khi deploy (backend đẩy lên Cloudinary)
      new URL('https://res.cloudinary.com/**')
    ]
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css'
      }
    }
  }
}

// Plugin next-intl: nối file cấu hình dịch src/i18n/request.ts vào Next
const withNextIntl = createNextIntlPlugin()

export default withNextIntl(nextConfig)
