import { RoleType, RoleValues } from '@/constants/type'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Next.js 16: file middleware.ts của khóa học đổi tên thành proxy.ts, hàm middleware → proxy.
// Chạy TRƯỚC khi trang render → chặn / chuyển hướng mà người dùng không kịp thấy trang sai

// Phải đăng nhập mới vào được
const privatePaths = ['/my-courses', '/learn', '/profile', '/instructor', '/admin']
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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  // Cookie accessToken do Route Handler /api/auth/login (register) đặt, tự hết hạn sau 15 phút
  const accessToken = request.cookies.get('accessToken')?.value
  const isAuth = Boolean(accessToken)

  // 1. Chưa đăng nhập mà vào trang riêng → về trang đăng nhập
  if (matchPath(pathname, privatePaths) && !isAuth) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Đăng nhập rồi mà vào đăng nhập / đăng ký / quên mật khẩu → về trang chủ
  if (matchPath(pathname, unAuthPaths) && isAuth) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 3. Đăng nhập rồi nhưng sai role → về trang chủ
  if (accessToken) {
    const role = getRoleFromAccessToken(accessToken)
    if (matchPath(pathname, instructorPaths) && role !== RoleValues.Instructor) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    if (matchPath(pathname, adminPaths) && role !== RoleValues.Admin) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

// Proxy chỉ chạy với các đường dẫn này (trang công khai như /, /courses không cần chạy).
// ':path*' khớp cả chính route đó lẫn mọi trang con: '/admin', '/admin/users', ...
export const config = {
  matcher: [
    '/my-courses/:path*',
    '/learn/:path*',
    '/profile/:path*',
    '/instructor/:path*',
    '/admin/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password'
  ]
}
