import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

// Bản thay cho Link / useRouter / usePathname / redirect của Next: tự gắn tiền tố ngôn ngữ đang xem.
//   <Link href='/courses'> ở trang tiếng Anh → /en/courses
//   usePathname() trả về đường dẫn KHÔNG có tiền tố ('/courses' cả khi đang ở /en/courses)
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
