import { defineRouting } from 'next-intl/routing'

// Song ngữ Việt – Anh, ngôn ngữ nằm trên URL:
//   tiếng Việt (mặc định) KHÔNG có tiền tố: /courses  → link cũ, link PayPal / SePay trả về vẫn đúng
//   tiếng Anh có tiền tố /en:                /en/courses
// localeDetection: false → chỉ URL quyết định ngôn ngữ (không tự đoán theo trình duyệt / cookie),
// người dùng đổi bằng nút VI / EN trên header
export const routing = defineRouting({
  locales: ['vi', 'en'],
  defaultLocale: 'vi',
  localePrefix: 'as-needed',
  localeDetection: false
})
