# Luồng hoạt động code Edu Platform

Đọc từ trên xuống. Mỗi phần có:

- **Luồng:** các file theo đúng thứ tự dữ liệu đi qua. Bấm vào link để mở file.
- **Cần hiểu:** những chỗ hay bị hỏi khi phỏng vấn, hoặc dễ hiểu nhầm.
- **Code lại:** thứ tự viết lại khi đã hiểu (làm trên nhánh `practice/...`, xong dùng `git diff main` để so với bản gốc).

Chỗ nào chưa hiểu thì ghi lại tên file + số dòng rồi hỏi.

Tài liệu đi kèm: [API.md](API.md) (API nhận gì, trả gì), [features.md](features.md) (danh sách chức năng).

---

## 0. Bức tranh tổng

```
Trình duyệt
   │  1. gõ URL / bấm link
   ▼
Next.js (Vercel)
   ├─ proxy.ts             chạy TRƯỚC mọi trang: chặn theo đăng nhập / role, gắn ngôn ngữ (vi / en)
   ├─ Server Component     chạy trên server Next: gọi API lấy dữ liệu rồi trả HTML
   ├─ Client Component     chạy ở trình duyệt: form, nút bấm, React Query
   └─ Route Handler /api   đặt / xóa cookie httpOnly (đăng nhập, refresh, đăng xuất)
   │  2. fetch qua lib/http.ts (gắn Authorization: Bearer <accessToken>)
   ▼
Express (Render)
   app.ts → middleware chung → router → requireAuth → requirePermission → validate → controller → service
   │  3. Prisma
   ▼
PostgreSQL (Neon)          dữ liệu
Redis (Render Key Value)   hàng đợi email, job dọn dẹp hằng ngày (BullMQ)
```

**Frontend: 4 lớp, đọc theo thứ tự này**

| Lớp | Thư mục | Việc |
|---|---|---|
| Schema | [`schemaValidations/`](../frontend/src/schemaValidations) | Zod: body gửi đi, response nhận về (viết khớp với backend) |
| Gọi API | [`apiRequests/`](../frontend/src/apiRequests) | Mỗi hàm gọi 1 endpoint qua `http.ts` |
| Hook | [`queries/`](../frontend/src/queries) | React Query: `useXxxQuery` (đọc), `useXxxMutation` (ghi) + `invalidateQueries` |
| Giao diện | [`app/[locale]/`](<../frontend/src/app/[locale]>) | Trang (`page.tsx`) và component |

**Backend: 4 file cho mỗi module** ([`modules/`](../backend/src/modules))

| File | Việc |
|---|---|
| `xxx.schema.ts` | Zod: kiểm tra body / params / query |
| `xxx.route.ts` | URL + method + chuỗi middleware |
| `xxx.controller.ts` | Đọc `req`, gọi service, trả `res.json(...)` |
| `xxx.service.ts` | Logic nghiệp vụ + Prisma, sai thì `throw new HttpError(...)` |

---

## 1. Khởi động

### Backend

**Luồng**
1. [`server.ts`](../backend/src/server.ts): `app.listen(PORT)`, có `RUN_WORKER=true` thì chạy luôn worker.
2. [`config/env.ts`](../backend/src/config/env.ts): đọc `.env`, kiểm tra bằng Zod. Thiếu biến thì **dừng ngay**.
3. [`lib/prisma.ts`](../backend/src/lib/prisma.ts): kết nối PostgreSQL.
4. [`app.ts`](../backend/src/app.ts): đọc kỹ file này, mọi request đều đi qua đây. Thứ tự:
   - `trust proxy` → `helmet` → `cors` → `morgan` (log) → `apiLimiter` → `express.json()` → `/uploads` (file tĩnh)
   - các router: `/auth`, `/profile`, `/notifications`, `/orders`, `/payments`, rồi `protectedRouters`
   - cuối cùng: `notFoundHandler` → `errorHandler`
5. [`queues/workers.ts`](../backend/src/queues/workers.ts): worker gửi email + job dọn dẹp lúc 3h sáng.
6. [`prisma/schema.prisma`](../backend/prisma/schema.prisma): toàn bộ bảng. Đọc lướt các `model` để biết có những dữ liệu gì.

**Cần hiểu**
- Vì sao `errorHandler` phải đặt **cuối cùng** và phải có đủ 4 tham số?
- `protectedRouters` dùng để làm gì? (gợi ý: script `sync-permissions`)
- Express 5 tự bắt lỗi của hàm `async` → service chỉ cần `throw`, không phải `try/catch` rồi gọi `next(error)`.

### Frontend

**Luồng**
1. [`proxy.ts`](../frontend/src/proxy.ts): chạy trước mọi trang (xem mục 4).
2. [`app/[locale]/layout.tsx`](<../frontend/src/app/[locale]/layout.tsx>): `<html lang>`, font, `NextIntlClientProvider` (bản dịch), `ThemeProvider` (sáng / tối), `AppProvider`, `Toaster`.
3. [`components/app-provider.tsx`](../frontend/src/components/app-provider.tsx):
   - `QueryClient` của React Query
   - context `role / isAuth / setRole` (đọc role từ access token trong localStorage)
   - `<RefreshToken />` (xem mục 3)
4. Layout theo khu vực:
   - [`(public)/layout.tsx`](<../frontend/src/app/[locale]/(public)/layout.tsx>): header (menu, tìm kiếm, ngôn ngữ, sáng / tối, đơn hàng, chuông, tài khoản) + footer.
   - [`instructor/layout.tsx`](<../frontend/src/app/[locale]/instructor/layout.tsx>), [`admin/layout.tsx`](<../frontend/src/app/[locale]/admin/layout.tsx>): dùng [`DashboardShell`](../frontend/src/components/dashboard/dashboard-shell.tsx) (menu bên trái).
5. [`i18n/`](../frontend/src/i18n): [`routing.ts`](../frontend/src/i18n/routing.ts) (vi không có tiền tố, en có `/en`), [`request.ts`](../frontend/src/i18n/request.ts) (nạp `messages/vi.json`, `messages/en.json`), [`navigation.ts`](../frontend/src/i18n/navigation.ts) (`Link`, `useRouter` tự gắn tiền tố ngôn ngữ).

**Cần hiểu**
- `(public)` có dấu ngoặc là **route group**: chỉ để gom layout, không xuất hiện trên URL.
- Server Component và Client Component khác nhau ở đâu? File nào có `'use client'`?
- Vì sao `<html>` nằm trong `[locale]/layout.tsx` chứ không phải `app/layout.tsx`?

---

## 2. Một request đi từ đầu đến cuối

Học kỹ mục này trước: mọi chức năng phía sau đều theo đúng mẫu này.

### 2a. Đọc dữ liệu: danh mục ở trang chủ (Server Component)

1. [`(public)/page.tsx`](<../frontend/src/app/[locale]/(public)/page.tsx>): trang chủ gồm nhiều khối, mỗi khối gọi API nằm trong `<Suspense>` riêng.
2. [`category-section.tsx`](<../frontend/src/app/[locale]/(public)/category-section.tsx>): component `async`, gọi `categoryApiRequest.list(...)`.
3. [`apiRequests/category.ts`](../frontend/src/apiRequests/category.ts) → [`lib/http.ts`](../frontend/src/lib/http.ts): ghép `NEXT_PUBLIC_API_END_POINT` + `/categories`, `fetch`, không `ok` thì ném lỗi.
4. Backend: [`app.ts`](../backend/src/app.ts) → [`category.route.ts`](../backend/src/modules/category/category.route.ts) `GET /` → `validateQuery` ([`validate.middleware.ts`](../backend/src/middleware/validate.middleware.ts)) → [`category.controller.ts`](../backend/src/modules/category/category.controller.ts) `getCategories` → [`category.service.ts`](../backend/src/modules/category/category.service.ts) (`count` + `findMany` chạy song song) → `res.json({ message, data, totalItems, page, limit, totalPages })`.
5. Quay lại Next: render HTML có sẵn dữ liệu, gửi về trình duyệt.

### 2b. Ghi dữ liệu: admin tạo danh mục (Client Component)

1. [`admin/categories/category-form-dialog.tsx`](<../frontend/src/app/[locale]/admin/categories/category-form-dialog.tsx>): React Hook Form + `zodResolver(schema)` → `onSubmit`.
2. [`queries/useCategory.ts`](../frontend/src/queries/useCategory.ts) `useCreateCategoryMutation`: `mutationFn` gọi API, `onSuccess` gọi `invalidateQueries(['categories'])` → bảng tự tải lại.
3. `http.ts` (phía trình duyệt): tự gắn `Authorization: Bearer <accessToken>` lấy từ localStorage.
4. Backend `POST /categories`:
   - `requireAuth` ([`auth.middleware.ts`](../backend/src/middleware/auth.middleware.ts)): kiểm tra token → `req.user`
   - `requirePermission`: role có quyền `POST /categories` không?
   - `validateBody` → controller → service
5. Lỗi:
   - service `throw new HttpError(409, ...)` → [`error.middleware.ts`](../backend/src/middleware/error.middleware.ts) trả JSON
   - frontend `handleErrorApi` ([`lib/utils.ts`](../frontend/src/lib/utils.ts)): 422 thì gắn vào ô của form, lỗi khác thì toast

**Cần hiểu**
- Vì sao chia 3 tầng route / controller / service?
- `validateBody` sai thì trả gì? Frontend gắn lỗi vào đúng ô bằng cách nào?
- `invalidateQueries` làm gì? Nếu không gọi thì sao?
- `select` trong Prisma để làm gì? (không trả `deletedAt`, `password`...)

**Code lại:** module `category` của backend (schema → service → controller → route) → `schemaValidations/category.schema.ts` → `apiRequests/category.ts` → `queries/useCategory.ts` → trang `admin/categories`.

---

## 3. Đăng ký, đăng nhập, giữ đăng nhập, đăng xuất

### 3a. Đăng nhập

**Luồng**
1. [`login/form-login.tsx`](<../frontend/src/app/[locale]/(public)/(auth)/login/form-login.tsx>): `useLoginMutation` → `setRole(...)` → `router.push('/')`.
2. [`apiRequests/auth.ts`](../frontend/src/apiRequests/auth.ts):
   - `login` gọi **Route Handler của Next** (`baseUrl: ''`), không gọi thẳng backend
   - `sLogin` là bản server Next dùng để gọi backend
3. [`app/api/auth/login/route.ts`](../frontend/src/app/api/auth/login/route.ts): gọi backend → nhận 2 token → đặt **2 cookie httpOnly** (hết hạn đúng lúc token hết hạn) → trả token về trình duyệt.
4. `http.ts` thấy URL là `api/auth/login` → lưu 2 token vào **localStorage**.
5. Backend [`auth.service.ts`](../backend/src/modules/auth/auth.service.ts) `login`:
   - tìm user, so mật khẩu bằng bcrypt ([`utils/crypto.ts`](../backend/src/utils/crypto.ts))
   - tài khoản bị khóa → 403
   - `generateTokens`: ký 2 JWT ([`utils/jwt.ts`](../backend/src/utils/jwt.ts)), **lưu refresh token vào DB**

Đăng ký ([`register/`](<../frontend/src/app/[locale]/(public)/(auth)/register>), [`api/auth/register/route.ts`](../frontend/src/app/api/auth/register/route.ts)) làm y hệt. Backend tạo user + cấp token trong cùng 1 transaction, rồi đẩy email chào mừng vào hàng đợi.

**Cần hiểu**
- Vì sao token nằm ở **cả** cookie httpOnly **lẫn** localStorage? (cookie cho `proxy` và Server Component đọc, localStorage cho `http.ts` phía trình duyệt gắn header)
- Vì sao sai email và sai mật khẩu báo **cùng một câu**?
- Access token chứa gì (`userId`, `roleName`)? Refresh token chứa gì? Vì sao refresh token không chứa role?

### 3b. Giữ đăng nhập (refresh token)

**Luồng**
1. [`components/refresh-token.tsx`](../frontend/src/components/refresh-token.tsx): mỗi giây gọi `checkAndRefreshToken` một lần.
2. [`lib/utils.ts`](../frontend/src/lib/utils.ts) `checkAndRefreshToken`: access token còn dưới 1/3 thời gian sống thì gọi `authApiRequest.refreshToken()`.
3. `apiRequests/auth.ts` `refreshToken()`: có request đang chạy thì **dùng lại nó** (`refreshTokenRequest`). Nhiều chỗ gọi cùng lúc cũng chỉ gửi 1 request.
4. [`app/api/auth/refresh-token/route.ts`](../frontend/src/app/api/auth/refresh-token/route.ts): đọc refresh token từ cookie → backend → đặt lại cookie. Lỗi thì **xóa cookie** + trả 401.
5. Backend `refreshToken`: trong 1 transaction, **xóa token cũ** (không xóa được dòng nào = token đã dùng → 401) → đọc lại user (có thể đã bị khóa) → cấp cặp token mới.
6. Lâu ngày quay lại web (cookie access đã hết hạn, refresh vẫn còn): `proxy.ts` chuyển sang [`/refresh-token?redirect=...`](<../frontend/src/app/[locale]/(public)/(auth)/refresh-token/refresh-token.tsx>) → làm mới với `force: true` → quay về đúng trang cũ.

**Cần hiểu**
- Refresh token **xoay vòng** là gì? Vì sao gửi 2 request refresh cùng lúc thì bị đăng xuất?
- `getSafeRedirect` chặn cái gì? (open redirect)
- Vì sao Route Handler refresh phải xóa cookie khi lỗi? (để `proxy` không tưởng là vẫn còn đăng nhập)

### 3c. Đăng xuất và 401

1. [`components/account-menu.tsx`](../frontend/src/components/account-menu.tsx): bấm "Đăng xuất" → `useLogoutMutation` → [`api/auth/logout/route.ts`](../frontend/src/app/api/auth/logout/route.ts) (xóa cookie trước, rồi báo backend xóa refresh token trong DB; **luôn trả 200**).
2. `http.ts` gặp 401 (trừ các request đăng nhập / refresh / logout):
   - trình duyệt: logout 1 lần → xóa token → `location.href = '/login'`
   - server: `redirect('/logout?accessToken=...')` → [`logout.tsx`](<../frontend/src/app/[locale]/(public)/(auth)/logout/logout.tsx>)

**Code lại (đúng thứ tự đã làm theo khóa học):** `api/auth/login/route.ts` → `http.ts` → `checkAndRefreshToken` → `refresh-token.tsx` → trang `/refresh-token` → `proxy.ts`.

---

## 4. Chặn trang và ngôn ngữ ([`proxy.ts`](../frontend/src/proxy.ts))

**Luồng** (mỗi request trang đều đi qua)
1. `splitLocale`: `/en/admin` → tiền tố `/en` + đường dẫn `/admin`.
2. Đọc 2 cookie. Còn `refreshToken` = còn đăng nhập.
3. Lần lượt kiểm tra:
   - trang riêng mà chưa đăng nhập → `/login`
   - trang đăng nhập / đăng ký mà đã đăng nhập → `/`
   - mất access token → `/refresh-token`
   - sai role → `/`
4. Qua hết → `intlProxy(request)`: next-intl viết lại `/courses` → `/vi/courses` bên trong (URL trên thanh địa chỉ không đổi).
5. `config.matcher`: đường dẫn nào được chạy qua proxy. Có thêm dòng riêng cho `/courses/...` vì slug có dấu chấm (lỗi 404 ngày 30/10).

**Cần hiểu**
- `proxy` chỉ để **điều hướng cho mượt**. Kiểm tra quyền thật vẫn do backend làm (401 / 403).
- `matchPath` khác `startsWith` ở chỗ nào?
- Vì sao `/en/...` vẫn chạy được khi proxy không chạy, còn tiếng Việt thì không?

---

## 5. Danh sách khóa học (`/courses`)

**Luồng**
1. [`courses/page.tsx`](<../frontend/src/app/[locale]/(public)/courses/page.tsx>): Server Component, 2 khối `<Suspense>` (bộ lọc, danh sách).
2. [`course-filter.tsx`](<../frontend/src/app/[locale]/(public)/courses/course-filter.tsx>) (client):
   - đổi bộ lọc → `updateParam` → `router.push('/courses?...')`, xóa `page`
   - ô tìm kiếm: debounce 400ms, giữ 3 giá trị (`urlSearch`, `searchText`, `lastPushed`)
3. URL đổi → Next render lại [`course-list.tsx`](<../frontend/src/app/[locale]/(public)/courses/course-list.tsx>) (server):
   - `first()` + `GetCoursesQuery.safeParse` đọc `searchParams` (URL sai thì bỏ qua, trang không lỗi)
   - gọi API
4. [`components/pagination-links.tsx`](../frontend/src/components/pagination-links.tsx): link giữ nguyên bộ lọc, chỉ đổi `page`.
5. Backend [`course.service.ts`](../backend/src/modules/course/course.service.ts) `getPublicCourses`: dựng `where` theo bộ lọc, `orderBy` theo `sort`, chỉ lấy khóa `PUBLISHED`.

**Cần hiểu**
- Vì sao để bộ lọc trên URL thay vì `useState`?
- Vì sao `orderBy` luôn có thêm `id`? (dữ liệu trùng `createdAt` thì phân trang không bị lặp / sót)
- Debounce là gì? Ba giá trị trong ô tìm kiếm để làm gì?

**Code lại:** `toQueryString` → `course-list.tsx` (chưa có bộ lọc) → `pagination-links.tsx` → `course-filter.tsx` (Select trước, ô tìm kiếm debounce sau).

---

## 6. Chi tiết khóa học (`/courses/[slug]`)

**Luồng**
1. [`courses/[slug]/page.tsx`](<../frontend/src/app/[locale]/(public)/courses/[slug]/page.tsx>):
   - `getIdFromSlugUrl('ten-khoa-i.15')` → 15 ([`lib/format.ts`](../frontend/src/lib/format.ts))
   - `getCourse = cache(...)`: `generateMetadata` và trang dùng chung 1 lần gọi API
   - `Promise.allSettled([khóa học, đánh giá])`: đánh giá lỗi thì trang vẫn hiện
   - 404 → `notFound()`. Slug sai chữ → `redirect` về slug chuẩn.
2. Backend `GET /courses/:courseId` dùng `optionalAuth`: có token thì trả thêm `isEnrolled`.
3. Các phần con:
   - [`curriculum.tsx`](<../frontend/src/app/[locale]/(public)/courses/[slug]/curriculum.tsx>): mục lục
   - [`course-reviews.tsx`](<../frontend/src/app/[locale]/(public)/courses/[slug]/course-reviews.tsx>): đánh giá
   - [`enroll-button.tsx`](<../frontend/src/app/[locale]/(public)/courses/[slug]/enroll-button.tsx>): client, xem mục 7

**Cần hiểu**
- `generateMetadata` dùng để làm gì (SEO, Open Graph)?
- `cache()` của React khác cache của React Query thế nào?
- `isEnrolled` có 3 giá trị `null / false / true` nghĩa là gì?

---

## 7. Ghi danh và mua khóa học

**Luồng**
1. [`enroll-button.tsx`](<../frontend/src/app/[locale]/(public)/courses/[slug]/enroll-button.tsx>): đổi theo trạng thái
   - chưa đăng nhập → link `/login`
   - đã ghi danh → link `/learn/:id`
   - miễn phí → `useEnrollMutation` (`POST /enrollments`)
   - có phí → `useCreateOrderMutation` (`POST /orders`) → `/checkout/:orderId`
2. Backend:
   - [`enrollment.service.ts`](../backend/src/modules/enrollment/enrollment.service.ts): ghi danh khóa miễn phí, tạo thông báo cho giảng viên
   - [`order.service.ts`](../backend/src/modules/order/order.service.ts) `createOrder`: **chốt giá** lúc tạo đơn, đơn đang chờ cùng giá thì dùng lại, mã đơn `EDU` + 8 ký tự

---

## 8. Thanh toán

**Luồng**
1. [`checkout/[orderId]/checkout.tsx`](<../frontend/src/app/[locale]/(public)/checkout/[orderId]/checkout.tsx>):
   - `usePaymentMethodsQuery`: chỉ hiện các cổng đang bật
   - chọn cổng → `useStartPaymentMutation` (`POST /orders/:id/pay`)
   - MoMo / PayPal: trả `payUrl` → `window.location.href = payUrl` (sang trang của cổng)
   - SePay: hiện QR + nội dung chuyển khoản (`SepayTransfer`), `useOrderQuery` hỏi lại trạng thái đơn mỗi vài giây
2. Cổng trả người mua về [`checkout/[orderId]/result`](<../frontend/src/app/[locale]/(public)/checkout/[orderId]/result/checkout-result.tsx>) → `useConfirmPaymentMutation` (`POST /orders/:id/confirm`).
3. Backend [`payment.service.ts`](../backend/src/modules/payment/payment.service.ts):
   - `startPayment`: tạo giao dịch bên cổng ([`momo.ts`](../backend/src/modules/payment/momo.ts), [`paypal.ts`](../backend/src/modules/payment/paypal.ts), [`sepay.ts`](../backend/src/modules/payment/sepay.ts))
   - `confirmPayment`: MoMo thì hỏi trạng thái, PayPal thì **capture**
   - `handleMomoIpn` / `handleSepayWebhook`: cổng gọi về, kiểm tra chữ ký / API key
4. Mọi đường đều đi tới `markOrderPaid` ([`order.service.ts`](../backend/src/modules/order/order.service.ts)): `updateMany` có điều kiện `status != PAID` + ghi danh trong 1 transaction.

**Cần hiểu**
- Vì sao cần **cả** webhook lẫn nút confirm?
- Hai lần báo về cùng lúc thì chuyện gì xảy ra? (`updateMany` + `count`, bảng `PaymentLog` có unique)
- Vì sao chuyển sang trang cổng dùng `window.location.href` mà không dùng `router.push`?

---

## 9. Trang học và xem đủ 90%

**Luồng**
1. [`learn/[courseId]/page.tsx`](<../frontend/src/app/[locale]/learn/[courseId]/page.tsx>) → [`learn-course.tsx`](<../frontend/src/app/[locale]/learn/[courseId]/learn-course.tsx>) (client):
   - `useMyLearningQuery` (`GET /enrollments/mine/:courseId`): mục lục + tiến độ
   - bài đang xem nằm trên URL `?lecture=`
   - `useLectureQuery` (`GET /lectures/:id`): nội dung + video + chỗ đang xem dở
2. [`lecture-video.tsx`](<../frontend/src/app/[locale]/learn/[courseId]/lecture-video.tsx>):
   - đếm số giây **thực sự phát** (`timeupdate`, bỏ qua bước nhảy > 3 giây = tua)
   - cứ 15 giây (và khi dừng, hết video, chuyển tab) gọi `useReportWatchMutation` (`PUT /lectures/:id/watch`)
3. Backend [`enrollment.service.ts`](../backend/src/modules/enrollment/enrollment.service.ts) `reportWatch`:
   - số giây được cộng ≤ thời gian thực đã trôi qua × 2 + 5
   - đủ `requiredWatchSec` (90%, làm tròn xuống) thì tự đánh dấu học xong
4. Nút "Đánh dấu đã học" → `useToggleLectureCompleteMutation` → `invalidateQueries` → mục lục và % tự cập nhật.
5. Quiz: backend đã xong ([`quiz.service.ts`](../backend/src/modules/quiz/quiz.service.ts), route trong `lecture.route.ts`), frontend chưa làm.

**Cần hiểu**
- Vì sao không tin con số frontend gửi lên?
- Vì sao dùng `useRef` cho bộ đếm mà không dùng `useState`?
- `key={lecture.id}` ở chỗ dùng `LectureVideo` để làm gì?

---

## 10. Đánh giá, hồ sơ, upload, mật khẩu

**Đánh giá**
- [`my-review.tsx`](<../frontend/src/app/[locale]/(public)/courses/[slug]/my-review.tsx>) + [`review-form.tsx`](<../frontend/src/app/[locale]/(public)/courses/[slug]/review-form.tsx>) → [`queries/useReview.ts`](../frontend/src/queries/useReview.ts).
- Backend [`review.service.ts`](../backend/src/modules/review/review.service.ts): phải ghi danh mới được đánh giá, mỗi người một đánh giá cho mỗi khóa.

**Hồ sơ và upload ảnh**
- [`profile/avatar-form.tsx`](<../frontend/src/app/[locale]/(public)/profile/avatar-form.tsx>): chọn file → kiểm tra loại + dung lượng → xem trước (`URL.createObjectURL`) → `POST /uploads/image` (FormData) → `PUT /profile`.
- Backend:
  - [`upload.middleware.ts`](../backend/src/middleware/upload.middleware.ts): multer, tên file do server đặt
  - [`upload.controller.ts`](../backend/src/modules/upload/upload.controller.ts): kiểm tra magic bytes ([`file-signature.ts`](../backend/src/utils/file-signature.ts)) → Cloudinary ([`lib/cloudinary.ts`](../backend/src/lib/cloudinary.ts))

**Đổi mật khẩu**
- [`change-password-form.tsx`](<../frontend/src/app/[locale]/(public)/profile/change-password/change-password-form.tsx>) → [`api/profile/password/route.ts`](../frontend/src/app/api/profile/password/route.ts) (đặt cookie mới).
- Backend: đăng xuất mọi thiết bị khác, cấp token mới cho thiết bị đang dùng.

**Quên mật khẩu (3 bước)**
- [`forgot-password-flow.tsx`](<../frontend/src/app/[locale]/(public)/(auth)/forgot-password/forgot-password-flow.tsx>) điều khiển 3 bước: `email-step` → `otp-step` → `password-step`.
- Backend `auth.service.ts`:
  - `forgotPassword`: luôn trả cùng một kết quả, 60 giây mới gửi lại được, mã OTP lưu dạng băm
  - `verifyOtp`
  - `resetPassword`: kiểm tra lại mã, đổi mật khẩu + xóa mọi refresh token + xóa mã, trong 1 transaction
- Email: [`queues/email.queue.ts`](../backend/src/queues/email.queue.ts) → worker → [`lib/mailer.ts`](../backend/src/lib/mailer.ts) (Brevo hoặc SMTP).

---

## 11. Thông báo

**Luồng**
1. Backend [`notification.service.ts`](../backend/src/modules/notification/notification.service.ts) `notifySafely`: các service khác gọi khi:
   - gửi duyệt (→ admin)
   - duyệt / từ chối / gỡ (→ giảng viên)
   - có ghi danh, đánh giá, đơn hàng mới (→ giảng viên)
2. [`components/notification-bell.tsx`](../frontend/src/components/notification-bell.tsx):
   - `useUnreadCountQuery`: `refetchInterval` 30 giây (polling)
   - mở chuông mới tải danh sách
   - số chưa đọc tăng → `invalidateQueries` cho dữ liệu liên quan
   - bấm thông báo → mở `link`

**Cần hiểu:** polling khác SSE / WebSocket thế nào? Vì sao chọn polling trước?

---

## 12. Giảng viên

**Luồng**
1. Dashboard [`instructor-dashboard.tsx`](<../frontend/src/app/[locale]/instructor/instructor-dashboard.tsx>) → `useInstructorStatsQuery` → [`stats.service.ts`](../backend/src/modules/stats/stats.service.ts).
2. Danh sách [`instructor-courses.tsx`](<../frontend/src/app/[locale]/instructor/courses/instructor-courses.tsx>): lọc theo trạng thái, xóa khóa Nháp / Bị từ chối.
3. Tạo / sửa: [`course-form.tsx`](<../frontend/src/app/[locale]/instructor/courses/course-form.tsx>) dùng chung cho `new/` và `[id]/edit/`.
4. Soạn nội dung [`[id]/course-curriculum.tsx`](<../frontend/src/app/[locale]/instructor/courses/[id]/course-curriculum.tsx>):
   - thêm chương, đổi thứ tự (`moveItem` → `PUT /sections/reorder`), gửi duyệt
   - [`section-item.tsx`](<../frontend/src/app/[locale]/instructor/courses/[id]/section-item.tsx>): sửa / xóa chương, đổi thứ tự bài
   - [`lecture-sheet.tsx`](<../frontend/src/app/[locale]/instructor/courses/[id]/lecture-sheet.tsx>): form bài giảng + upload video (Cloudinary trả `durationSec`)
5. Học viên: [`[id]/students/course-students.tsx`](<../frontend/src/app/[locale]/instructor/courses/[id]/students/course-students.tsx>).
6. Backend [`course.service.ts`](../backend/src/modules/course/course.service.ts):
   - `getEditableOwnCourse`: phải là khóa **của mình** và đang **sửa được**, nếu không thì 404 / 403 / 409
   - `submitCourse`: chuyển `DRAFT` / `REJECTED` → `PENDING`, cần ít nhất 1 bài

**Cần hiểu**
- Vòng đời trạng thái khóa học: `DRAFT → PENDING → PUBLISHED / REJECTED`. Ai được đổi sang trạng thái nào?
- API đổi thứ tự nhận cả danh sách id rồi kiểm tra bằng `hasExactlyIds` ([`utils/ids.ts`](../backend/src/utils/ids.ts)). Vì sao lại làm vậy?

---

## 13. Admin

**Luồng**
1. Dashboard [`admin-dashboard.tsx`](<../frontend/src/app/[locale]/admin/admin-dashboard.tsx>) + [`components/dashboard/revenue-section.tsx`](../frontend/src/components/dashboard/revenue-section.tsx) (doanh thu 30 ngày) → `useAdminStatsQuery`.
2. Duyệt khóa: [`admin-courses.tsx`](<../frontend/src/app/[locale]/admin/courses/admin-courses.tsx>) (tab theo trạng thái) → [`[id]/course-review.tsx`](<../frontend/src/app/[locale]/admin/courses/[id]/course-review.tsx>): Duyệt / Từ chối / Gỡ, bắt buộc ghi lý do ([`reason-form.tsx`](<../frontend/src/app/[locale]/admin/courses/[id]/reason-form.tsx>)).
   - Backend `approveCourse`, `rejectCourse`, `unpublishCourse` → email + thông báo cho giảng viên.
3. Người dùng [`admin-users.tsx`](<../frontend/src/app/[locale]/admin/users/admin-users.tsx>): khóa / mở, đổi vai trò (không tự khóa mình) → [`user.service.ts`](../backend/src/modules/user/user.service.ts).
4. Danh mục: xem mục 2b.

---

## 14. Phân quyền theo bảng Permission

**Luồng**
1. Route nào có gắn `requirePermission` thì [`scripts/sync-permissions.ts`](../backend/src/scripts/sync-permissions.ts) đọc `router.stack` của `protectedRouters` → ghi vào bảng `Permission` (`GET /courses/mine/:courseId`...).
2. [`constants/default-permissions.ts`](../backend/src/constants/default-permissions.ts): quyền mặc định của `INSTRUCTOR` / `STUDENT`. `ADMIN` luôn có tất cả.
3. Mỗi request: `requirePermission` ghép `req.baseUrl + req.route.path` ([`utils/permission-path.ts`](../backend/src/utils/permission-path.ts)), rồi tìm trong 1 query (user còn hoạt động, role còn hoạt động, có permission khớp).

**Cần hiểu:** `requireRole('ADMIN')` khác `requirePermission` thế nào? Thêm route mới thì phải làm gì để role có quyền gọi?

---

## 15. Thứ tự code lại cho cả dự án

| # | Phần | Ghi chú |
|---|---|---|
| 1 | Mục 2: category end-to-end | Học mẫu chung, các mục sau lặp lại mẫu này |
| 2 | Mục 3 + 4: xác thực + proxy | Quan trọng nhất khi phỏng vấn |
| 3 | Mục 5: danh sách + bộ lọc URL | |
| 4 | Mục 6: trang chi tiết | SSR, metadata, slug |
| 5 | Mục 10: hồ sơ + upload + form | React Hook Form, FormData |
| 6 | Mục 7 + 9: ghi danh + trang học | `useRef`, sự kiện video |
| 7 | Mục 12: soạn khóa học | Nhiều mutation, đổi thứ tự |
| 8 | Mục 8: thanh toán | Đọc hiểu backend là chính |
| 9 | Mục 11, 13, 14 | Đọc hiểu |

Mỗi phần nên làm theo 4 mức:

1. Đọc và tự chú thích bằng lời của mình.
2. Sửa nhỏ (thêm một trường hợp mới).
3. Xóa file đi rồi viết lại trên nhánh `practice/...`.
4. Làm một chức năng mới theo cùng mẫu (vd wishlist).
