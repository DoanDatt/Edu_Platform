import { RoleType, RoleValues } from '@/constants/type'
import { routing } from '@/i18n/routing'
import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Next.js 16: file middleware.ts của khóa học đổi tên thành proxy.ts, hàm middleware → proxy.
// Chạy TRƯỚC khi trang render → chặn / chuyển hướng mà người dùng không kịp thấy trang sai

// Phải đăng nhập mới vào được
const privatePaths = ['/my-courses', '/my-orders', '/checkout', '/learn', '/profile', '/instructor', '/admin']
// Chỉ vào được khi CHƯA đăng nhập
const unAuthPaths = ['/login', '/register', '/forgot-password', '/reset-password']
// Theo role
const instructorPaths = ['/instructor']
const adminPaths = ['/admin']

// Khớp đúng route hoặc trang con của nó: '/admin' khớp '/admin' và '/admin/users',
// nhưng KHÔNG khớp '/administrator' (startsWith đơn thuần sẽ khớp nhầm)
const matchPath = (pathname: string, paths: string[]) =>
  paths.some((path) => pathname === path || pathname.startsWith(`${path}/`))

// Đọc roleName trong access token (không kiểm tra chữ ký, chỉ để điều hướng;
// kiểm tra quyền thật là việc của backend → 403).
// Viết riêng ở đây thay vì import lib/utils: utils kéo theo sonner, react-hook-form... là code
// phía trình duyệt, tài liệu Next khuyên proxy không phụ thuộc module dùng chung
const getRoleFromAccessToken = (accessToken: string): RoleType | undefined => {
  try {
    const payload = accessToken.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))).roleName
  } catch {
    return undefined
  }
}

// Middleware của next-intl: thêm / bỏ tiền tố ngôn ngữ, "viết lại" /courses → /vi/courses bên trong
const intlProxy = createMiddleware(routing)

// Tách tiền tố ngôn ngữ: '/en/my-courses' → { prefix: '/en', pathname: '/my-courses' }; tiếng Việt không có tiền tố
const splitLocale = (fullPathname: string) => {
  const locale = routing.locales.find((item) => fullPathname === `/${item}` || fullPathname.startsWith(`/${item}/`))
  if (!locale) return { prefix: '', pathname: fullPathname }
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`
  return { prefix, pathname: fullPathname.slice(locale.length + 1) || '/' }
}

export function proxy(request: NextRequest) {
  // Kiểm tra quyền trên đường dẫn KHÔNG có tiền tố ('/en/admin' vẫn là '/admin'),
  // chuyển hướng thì giữ nguyên ngôn ngữ đang xem (đang ở /en → về /en/login)
  const { prefix, pathname } = splitLocale(request.nextUrl.pathname)
  const { search } = request.nextUrl
  const redirectTo = (path: string) =>
    NextResponse.redirect(new URL(`${prefix}${path === '/' && prefix ? '' : path}`, request.url))
  // 2 cookie do Route Handler /api/auth/login, register, refresh-token đặt, mỗi cookie tự mất khi token hết hạn:
  //   accessToken: 15 phút · refreshToken: 7 ngày
  const accessToken = request.cookies.get('accessToken')?.value
  const refreshToken = request.cookies.get('refreshToken')?.value
  // Còn refresh token = phiên đăng nhập còn (access token hết hạn thì làm mới được)
  const isAuth = Boolean(refreshToken)

  // 1. Chưa đăng nhập (hoặc phiên 7 ngày đã hết) mà vào trang riêng → về trang đăng nhập
  if (matchPath(pathname, privatePaths) && !isAuth) {
    return redirectTo('/login')
  }

  // 2. Đăng nhập rồi mà vào đăng nhập / đăng ký / quên mật khẩu → về trang chủ
  if (matchPath(pathname, unAuthPaths) && isAuth) {
    return redirectTo('/')
  }

  // 3. Còn phiên nhưng access token đã hết hạn (thường là lâu ngày mới quay lại web)
  //    → sang /refresh-token làm mới, xong quay về đúng trang này (giữ cả ?query)
  //    Phải làm TRƯỚC bước 4: refresh token của Edu không có role, cần access token mới đọc được role
  if (matchPath(pathname, privatePaths) && !accessToken) {
    const url = new URL(`${prefix}/refresh-token`, request.url)
    // redirect KHÔNG kèm tiền tố: trang /refresh-token dùng router của next-intl, tự gắn lại tiền tố
    url.searchParams.set('redirect', pathname + search)
    return NextResponse.redirect(url)
  }

  // 4. Đăng nhập rồi nhưng sai role → về trang chủ (role đọc từ ACCESS token)
  if (accessToken) {
    const role = getRoleFromAccessToken(accessToken)
    if (matchPath(pathname, instructorPaths) && role !== RoleValues.Instructor) {
      return redirectTo('/')
    }
    if (matchPath(pathname, adminPaths) && role !== RoleValues.Admin) {
      return redirectTo('/')
    }
  }

  // Qua hết các bước kiểm tra → để next-intl xử lý ngôn ngữ
  return intlProxy(request)
}

// Chạy với MỌI trang (next-intl cần xử lý ngôn ngữ ở cả trang công khai),
// trừ /api (Route Handler), /_next, /_vercel và file tĩnh có dấu chấm (favicon.ico, ảnh...)
export const config = {
  matcher: [
    // Mọi trang, trừ /api, /_next, /_vercel và file tĩnh có dấu chấm (favicon.ico, ảnh...)
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // Slug khóa học có dấu chấm ('ten-khoa-i.15') nên dòng trên bỏ sót → khai báo riêng.
    // ([\\w-]+)? : có hoặc không có tiền tố ngôn ngữ (/en/courses/..., /courses/...)
    '/([\\w-]+)?/courses/(.+)'
  ]
}
