# Bản đồ khóa học → Edu Platform

Mỗi tính năng trong khóa "Next.js Super – Quản lý quán ăn" nằm ở file nào, Edu Platform có cần không, và **phải đổi gì** cho khớp backend Edu và Next.js 16. Đọc trước khi bắt tay vào một bài mới để biết trước chỗ nào khác khóa học.

Nguồn đối chiếu (đọc ngày 14/10/2026):
- `client/`: source khóa học bản mới nhất (Next 15, next-intl, socket, refresh token). Mọi đường dẫn `client/...` bên dưới là ở đây.
- `docs/API.md` + code trong `backend/`: backend Edu (Express).
- `frontend/node_modules/next/dist/docs/`: tài liệu Next.js **16.4** đi kèm dự án.

## Mục lục

1. [Khác biệt xuyên suốt](#1-khác-biệt-xuyên-suốt)
2. [Bản đồ từng tính năng](#2-bản-đồ-từng-tính-năng)
3. [Chi tiết những chỗ dễ sai](#3-chi-tiết-những-chỗ-dễ-sai)
4. [Thứ tự làm đề xuất](#4-thứ-tự-làm-đề-xuất)
5. [Ghi chú lý thuyết của khóa học](#5-ghi-chú-lý-thuyết-của-khóa-học)

---

## 1. Khác biệt xuyên suốt

Những điểm này ảnh hưởng tới **nhiều bài**, nhớ chúng thì phần lớn code khóa học chép sang được.

### Backend: Fastify (khóa học) → Express (Edu)

| Chỗ | Khóa học | Edu | Ảnh hưởng |
|---|---|---|---|
| Sai mật khẩu khi đăng nhập | 422 (lỗi gắn vào ô) | **401** `Email hoặc mật khẩu không đúng` | `http.ts` không được tự logout với 401 của login/register (**đã sửa**) |
| Role trong token | `role` | **`roleName`** | `decodeToken(...).role` → `.roleName` |
| Role trong **refresh token** | Có | **Không có** (chỉ `userId`) | Middleware không đọc role từ refresh token được (mục 3.1) |
| Đăng nhập trả `account` | Có | Có, `role` là chuỗi | Dùng thẳng `account.role` khi đăng nhập |
| Đăng ký | Không có | Trả token + `account` giống login | Cần Route Handler `api/auth/register` (**đã có**) |
| Logout | Cần header `Authorization` | **Không cần**, chỉ `{ refreshToken }` | `sLogout` bỏ header, Route Handler không bắt buộc có access token |
| Refresh token | Dùng lại được trong hạn | **Chỉ dùng 1 lần** (xoay vòng) | Bắt buộc chống gọi trùng (mục 3.2) |
| Danh sách | Trả **toàn bộ**, phân trang phía client | **Phân trang ở server** (`page`, `limit`, `totalPages`) | Bảng gọi API theo trang, không dùng `getPaginationRowModel` (mục 3.4) |
| Upload ảnh | `POST /media/upload`, `data` là chuỗi URL | `POST /uploads/image`, `data.url` | Sửa đường dẫn + cách lấy URL (mục 3.5) |
| Đổi mật khẩu | `/accounts/change-password-v2` trả token mới | `PUT /profile/password` trả token mới | Vẫn cần Route Handler cập nhật cookie như khóa học |
| Realtime | Socket.IO | **Không có** | Bỏ mọi phần socket |

### Next.js 15 (khóa học) → 16.4 (Edu)

| Chỗ | Khóa học | Next 16 | Nguồn |
|---|---|---|---|
| Chặn trang | `src/middleware.ts`, `export function middleware` | **`src/proxy.ts`**, `export function proxy` (tên cũ đã deprecated) | `docs/.../file-conventions/proxy.md` |
| `cookies()` | `await cookies()` | Giống, bắt buộc `await` | `.../functions/cookies.md` |
| `redirect()` | Dùng trong `http.ts` phía client | **Không chạy trong event handler** → `location.href` | `.../functions/redirect.md` (**đã sửa**) |
| Cache trang công khai | `fetch(..., { next: { tags } })` + `revalidateTag(tag)` | Dự án bật `cacheComponents`: dùng `'use cache'` + `cacheTag()`; `revalidateTag(tag, 'max')` (1 tham số đã deprecated) | `.../functions/revalidateTag.md`, `cacheTag.md` |
| `new Date()` trong layout | Dùng thoải mái | Lỗi lúc build với `cacheComponents` | Footer không ghi năm (**đã xử lý**) |

### shadcn/ui bản mới

| Khóa học | Edu |
|---|---|
| `Form`, `FormField`, `FormItem` | **`Controller` + `Field`, `FieldLabel`, `FieldError`** (`form-login.tsx` là mẫu) |
| `toast` từ `use-toast` | **`sonner`**: `toast.success(...)`, `toast(...)` |
| `cn` tự viết (clsx + tailwind-merge) | Component shadcn import `cn` từ **package `cn`** |
| `useAppStore` (zustand) | `useAppContext()` (Context, `app-provider.tsx`) |

### Nghiệp vụ: quán ăn → khóa học

| Khóa học | Edu |
|---|---|
| Owner / Employee / Guest | **ADMIN / INSTRUCTOR / STUDENT** |
| Khu `/manage` chung | **2 khu riêng**: `/instructor` (giảng viên) và `/admin` |
| Khách quét QR vào bàn | Không có. Mọi người đăng ký tài khoản thật |
| Đa ngôn ngữ `/vi`, `/en` | **Chỉ tiếng Việt**: bỏ thư mục `[locale]`, dùng `Link` / `useRouter` của Next thay vì `@/i18n/routing` |

---

## 2. Bản đồ từng tính năng

Trạng thái: ✅ đã làm · 🔲 cần làm · ➖ không cần.

### Nền tảng và đăng nhập

| Tính năng | File khóa học | Edu | Ghi chú |
|---|---|---|---|
| Fetch wrapper, `HttpError`, `EntityError` | `lib/http.ts` | ✅ | Thêm `isAuthRequest`: 401 của login/register không logout |
| Đăng nhập qua Route Handler (lưu cookie) | `app/api/auth/login/route.ts`, `apiRequests/auth.ts` | ✅ | |
| Form đăng nhập | `(auth)/login/login-form.tsx` | ✅ | Viết bằng `Field` + `Controller` |
| Đăng ký | (không có) | 🔲 | Route Handler ✅, còn form `register/form-register.tsx` |
| Trạng thái đăng nhập toàn app | `components/app-provider.tsx` | ✅ | Context `role` / `isAuth` / `setRole` |
| Menu công khai + layout | `(public)/nav-items.tsx`, `layout.tsx` | ✅ | |
| Đăng xuất | `api/auth/logout/route.ts`, `queries/useAuth.tsx`, `manage/dropdown-avatar.tsx` | 🔲 | `sLogout` không cần access token (mục 1) |
| Trang `/logout` khi server gặp 401 | `(auth)/login/logout.tsx` | 🔲 | `http.ts` phía server đang `redirect('/logout?accessToken=...')` → cần trang này |
| Tự refresh token | `components/refresh-token.tsx`, `checkAndRefreshToken` trong `lib/utils.ts`, `api/auth/refresh-token/route.ts`, `(auth)/refresh-token/` | 🔲 | Mục 3.2 |
| Chặn trang theo đăng nhập / role | `middleware.ts` | 🔲 | Đổi thành `proxy.ts`, mục 3.1 |
| Quên mật khẩu (OTP email) | (không có) | 🔲 | Tự làm: `POST /auth/forgot-password` → `POST /auth/reset-password`. Dev xem mã OTP ở `http://localhost:8025` |
| Đăng nhập Google | `(auth)/login/oauth/`, `api/auth/token/route.ts` | ➖ | Backend Edu chưa có |
| Khách đăng nhập bằng QR | `(public)/tables/`, `api/guest/*`, `apiRequests/guest.ts` | ➖ | |

### Trang công khai

| Tính năng | File khóa học | Edu | Ghi chú |
|---|---|---|---|
| Trang chủ render ở server | `(public)/page.tsx` | 🔲 | Danh sách khóa nổi bật: `GET /courses?sort=popular` |
| Trang chi tiết có slug đẹp | `(public)/dishes/[slug]/`, `generateSlugUrl`, `getIdFromSlugUrl` | 🔲 | `/courses/react-tu-co-ban-i.15`. Dùng `cache()` + `generateMetadata` giống khóa |
| Danh sách có tìm kiếm / lọc | (không có) | 🔲 | `/courses?search&categoryId&level&price&sort&page`: đọc `searchParams` bằng `GetCoursesQuery` |
| Modal xem nhanh (intercepting + parallel route) | `(public)/@modal/(.)dishes/[slug]/` | Tùy chọn | Hợp với **xem thử video bài preview** mà không rời trang chi tiết |
| SEO: metadata, Open Graph | `shared-metadata.ts`, `generateMetadata` | 🔲 | Root layout đã có `title.template` |
| `robots.txt`, `sitemap.xml` | `app/robots.ts`, `app/sitemap.ts` | 🔲 | Sitemap lấy từ `GET /courses` |
| Cập nhật cache khi admin sửa | `api/revalidate/route.ts`, `apiRequests/revalidate.ts` | 🔲 | Chỉ khi cache trang công khai. Next 16: `revalidateTag(tag, 'max')` |
| Trang about / privacy / terms | `(public)/about`… | Tùy chọn | Trang tĩnh |

### Khu đăng nhập (học viên)

| Tính năng | File khóa học | Edu | Ghi chú |
|---|---|---|---|
| Khóa học của tôi | (không có) | 🔲 | `GET /enrollments/mine` → thẻ khóa + thanh tiến độ |
| Trang học (video + mục lục + đánh dấu xong) | (không có) | 🔲 | `GET /enrollments/mine/:courseId`, `GET /lectures/:id`, `POST/DELETE /lectures/:id/complete` |
| Ghi danh | (đặt món của khách tương tự) | 🔲 | `POST /enrollments`. Khóa có phí → **402** (chưa có thanh toán) |
| Viết / sửa đánh giá | (không có) | 🔲 | `GET /reviews/mine/:courseId` → `null` thì form Viết, có thì form Sửa |
| Hồ sơ + ảnh đại diện | `manage/setting/update-profile-form.tsx` | 🔲 | `GET/PUT /profile`; upload ảnh trước (mục 3.5) |
| Đổi mật khẩu | `manage/setting/change-password-form.tsx`, `api/accounts/change-password-v2/route.ts` | 🔲 | Mục 3.6 |

### Khu quản lý (giảng viên, admin)

| Tính năng | File khóa học | Edu | Ghi chú |
|---|---|---|---|
| Layout sidebar + avatar | `manage/layout.tsx`, `nav-links.tsx`, `mobile-nav-links.tsx`, `menuItems.ts`, `dropdown-avatar.tsx` | 🔲 | Làm 2 lần: `/instructor` và `/admin`, mỗi khu một `menuItems` |
| Bảng + thêm / sửa / xóa | `manage/dishes/*`, `tables/*`, `accounts/*` | 🔲 | Mẫu cho: danh mục (admin), khóa học (giảng viên), user (admin). Phân trang server (mục 3.4) |
| Phân trang | `components/auto-pagination.tsx` | 🔲 | Chép được nguyên, `pageSize` = `totalPages` từ API |
| Dashboard + biểu đồ | `manage/dashboard/*`, `queries/useIndicator.tsx` | 🔲 | `GET /stats/admin`, `GET /stats/instructor`. Không có lọc theo ngày như khóa |
| Soạn chương / bài, kéo thả thứ tự | (không có) | 🔲 | `/sections`, `/lectures` (+ `/reorder`), upload video `POST /uploads/video` |
| Duyệt khóa (admin) | (không có) | 🔲 | `GET /courses/pending`, approve / reject / unpublish |
| Khóa / mở user, đổi role | `manage/accounts/*` (gần giống) | 🔲 | `PUT /users/:id/status`, `PUT /users/:id/role` |
| Quản lý đơn hàng realtime | `manage/orders/*`, socket | ➖ | |

---

## 3. Chi tiết những chỗ dễ sai

### 3.1 `proxy.ts` (middleware của khóa học)

Khóa học kiểm tra role bằng **refresh token** (`decodeToken(refreshToken).role`). Refresh token của Edu **không chứa role**, nên phải đọc `roleName` từ **access token**. Cookie access token tự mất khi hết hạn 15 phút, nên luồng là:

```ts
// src/proxy.ts (Next 16: tên file và tên hàm đều là proxy)
const privatePaths = ['/my-courses', '/learn', '/profile', '/instructor', '/admin']
const unAuthPaths = ['/login', '/register']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('accessToken')?.value
  const refreshToken = request.cookies.get('refreshToken')?.value
  const isPrivate = privatePaths.some((path) => pathname.startsWith(path))

  // 1. Chưa đăng nhập mà vào trang riêng → /login
  if (isPrivate && !refreshToken) return NextResponse.redirect(new URL('/login', request.url))

  // 2. Đã đăng nhập mà vào /login, /register → trang chủ
  if (refreshToken && unAuthPaths.some((path) => pathname.startsWith(path)))
    return NextResponse.redirect(new URL('/', request.url))

  // 3. Access token hết hạn (cookie đã mất) → trang refresh rồi quay lại
  if (isPrivate && !accessToken) {
    const url = new URL('/refresh-token', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // 4. Sai role → trang chủ. Đọc roleName từ ACCESS token
  if (isPrivate && accessToken) {
    const { roleName } = decodeAccessToken(accessToken)
    if (pathname.startsWith('/admin') && roleName !== 'ADMIN') return NextResponse.redirect(new URL('/', request.url))
    if (pathname.startsWith('/instructor') && roleName !== 'INSTRUCTOR') return NextResponse.redirect(new URL('/', request.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ['/my-courses/:path*', '/learn/:path*', '/profile/:path*', '/instructor/:path*', '/admin/:path*', '/login', '/register'] }
```

- Khóa học gắn `refreshToken` vào URL trang `/refresh-token` để so với localStorage. Refresh token nằm trên URL sẽ lưu vào lịch sử trình duyệt; Edu có thể bỏ, vì Route Handler `api/auth/refresh-token` tự đọc từ cookie.
- Proxy chỉ để **điều hướng cho mượt**. Kiểm tra quyền thật vẫn là backend (403).

### 3.2 Refresh token tự động

Khóa học: `components/refresh-token.tsx` chạy `setInterval` mỗi giây, gọi `checkAndRefreshToken`, refresh khi access token còn dưới 1/3 thời gian sống (15 phút → còn dưới 5 phút).

Đổi cho Edu:
- **Bỏ nhánh guest** trong `checkAndRefreshToken` (`role === Role.Guest ? guestApiRequest...`), Edu chỉ có `authApiRequest.refreshToken()`.
- **Chống gọi trùng là bắt buộc.** Refresh token Edu dùng 1 lần: 2 lời gọi cùng lúc thì lời gọi sau nhận 401 và người dùng bị đăng xuất. Giữ nguyên mẹo `refreshTokenRequest` dùng chung trong `apiRequests/auth.ts` của khóa học.
- Không chạy ở `/login`, `/register`, `/logout`, `/refresh-token` (giống `UNAUTHENTICATED_PATH`).
- Lỗi thì: dừng interval, `setRole()`, chuyển `/login`. Bỏ `disconnectSocket()`.
- Khi đổi mật khẩu hoặc admin khóa tài khoản, backend thu hồi **mọi** refresh token → lần refresh sau lỗi → tự đăng xuất. Đúng ý muốn.

### 3.3 Đăng xuất

- Route Handler `api/auth/logout`: đọc `refreshToken` từ cookie, xóa 2 cookie, gọi `sLogout({ refreshToken })`. **Không cần** access token như khóa học, kể cả khi access token đã hết hạn.
- Luôn trả 200 cho trình duyệt (khóa học cũng vậy): đăng xuất phía giao diện không được thất bại.
- Sau đó: `setRole()` (xóa localStorage), `router.push('/')`.

### 3.4 Bảng có phân trang

Khóa học lấy **hết** món ăn rồi chia trang ở trình duyệt (`getPaginationRowModel`, `PAGE_SIZE = 10`). Edu trả **từng trang**:

```ts
// queries: page nằm trong queryKey → đổi trang là gọi API trang mới
export const useMyCoursesQuery = (query: GetMyCoursesQueryType) =>
  useQuery({ queryKey: ['courses', 'mine', query], queryFn: () => courseApiRequest.mine(query) })

// bảng: dữ liệu đã là 1 trang, chỉ hiển thị
useReactTable({ data: res.payload.data, columns, manualPagination: true, pageCount: res.payload.totalPages, ... })

// AutoPagination: page lấy từ ?page= trên URL, pageSize = totalPages
```

Thêm / sửa / xóa xong thì `invalidateQueries({ queryKey: ['courses', 'mine'] })` (không `exact`) để mọi trang được tải lại.

### 3.5 Upload ảnh / video

Khóa học: `mediaApiRequest.upload(formData)` → `result.payload.data` **là chuỗi URL**. Edu:

```ts
const formData = new FormData()
formData.append('file', file)                       // tên field phải là "file"
const { payload } = await http.post<UploadRes>('/uploads/image', formData)
const imageUrl = payload.data.url                   // data là object { url, mimeType, size, originalName }
```

`http.ts` đã tự bỏ `Content-Type` khi body là `FormData` (giống khóa học). Video: `/uploads/video`, chỉ giảng viên / admin, tối đa 500 MB.

### 3.6 Đổi mật khẩu

`PUT /profile/password` thành công thì **mọi thiết bị khác bị đăng xuất** và trả cặp token mới cho thiết bị đang dùng. Giống `change-password-v2` của khóa học, cần:
1. Route Handler `api/profile/password/route.ts`: đọc access token từ cookie, gọi backend, **ghi đè 2 cookie** bằng token mới.
2. Form: lưu đè 2 token mới vào localStorage.

Thiếu bước 1 thì cookie còn refresh token cũ (đã bị thu hồi) → lần refresh sau bị đăng xuất.

### 3.7 Trang công khai có cache (Next 16)

Khóa học: `http.get('dishes', { next: { tags: ['dishes'] } })` + `revalidateTag('dishes')`. Dự án Edu bật `cacheComponents`, theo tài liệu Next 16:
- Hàm lấy dữ liệu đánh dấu `'use cache'` và gọi `cacheTag('courses')`.
- Khi admin duyệt / gỡ khóa: `revalidateTag('courses', 'max')` (bản 1 tham số đã deprecated).

Đọc `frontend/node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md` trước khi làm phần này. Bản đơn giản hơn: không cache, trang luôn lấy dữ liệu mới.

---

## 4. Thứ tự làm đề xuất

Mỗi bước dùng được ngay những gì bước trước làm.

| # | Việc | Dựa trên bài của khóa |
|---|---|---|
| 1 | Form đăng ký | Login form |
| 2 | Đăng xuất + menu avatar trên header | Logout, dropdown-avatar |
| 3 | Refresh token tự động + trang `/refresh-token` + `proxy.ts` | Refresh token, middleware |
| 4 | Danh sách khóa học (lọc, phân trang) + trang chi tiết | Trang chủ SSR, dishes/[slug] |
| 5 | Ghi danh, Khóa học của tôi, trang học | (tự làm, dùng React Query như các bài manage) |
| 6 | Hồ sơ, ảnh đại diện, đổi mật khẩu, quên mật khẩu | Setting |
| 7 | Khu giảng viên: dashboard, khóa của tôi, soạn chương / bài | Layout manage, bảng CRUD, upload |
| 8 | Khu admin: dashboard, duyệt khóa, danh mục, user | Như bước 7 |
| 9 | SEO: metadata, sitemap, robots, cache trang công khai | SEO |

---

## 5. Ghi chú lý thuyết của khóa học

Các file `.md` trong `client/`:

| File | Nội dung | Áp dụng cho Edu |
|---|---|---|
| `authentication.md` | Dùng Route Handler của Next làm proxy để ghi cookie; Server Component biết đăng nhập nhờ cookie, Client Component nhờ localStorage | Đúng như Edu đang làm |
| `refresh-token.md` | 2 tình huống hết hạn (đang dùng / lâu ngày quay lại) và 5 lưu ý tránh bug | Đọc trước bước 3. Lưu ý "không gọi trùng" càng quan trọng vì token Edu dùng 1 lần |
| `stateful-stateless.md` | So sánh 2 kiểu xác thực | Edu **kết hợp**: access token kiểu stateless (JWT), refresh token lưu DB (stateful) để thu hồi được; backend còn kiểm tra user bị khóa ở mỗi request |
| `role-based-vs-permission-based.md` | RBAC và PBAC | Edu có cả hai: user gắn **role**, role gắn **danh sách permission** sửa được ở trang admin |
| `role-trong-du-an.md` | Quyền Owner / Employee / Guest | Thay bằng bảng quyền ở mục 3 của `docs/API.md` |
| `parallel-route.md`, `intercepting-route.md` | Slot `@modal`, route `(.)` | Nếu làm modal xem thử video |
| `SEO-Checlist.md` | Checklist SEO | Bước 9 |
| `da-ngon-ngu.md` | i18n | ➖ (Edu chỉ tiếng Việt) |
