import { defineRouting } from 'next-intl/routing'

// Song ngữ Anh – Việt, ngôn ngữ nằm trên URL (từ 31/10/2026 tiếng Anh là mặc định, theo đúng bản EduPress):
//   tiếng Anh (mặc định) KHÔNG có tiền tố: /courses  → link PayPal / SePay / email trả về vẫn chạy (mở bản tiếng Anh)
//   tiếng Việt có tiền tố /vi:              /vi/courses
//   Link cũ /en/... được next-intl tự chuyển về /... (bỏ tiền tố của ngôn ngữ mặc định)
// localeDetection: false → chỉ URL quyết định ngôn ngữ (không tự đoán theo trình duyệt / cookie),
// người dùng đổi bằng nút VI / EN trên header
export const routing = defineRouting({
  locales: ['vi', 'en'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  localeDetection: false
})
