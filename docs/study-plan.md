# Kế hoạch học Edu Platform theo ngày

20 ngày, mỗi ngày **một tính năng trọn vẹn**: đọc backend → thử bằng Postman → làm (hoặc đọc lại) frontend. Hết mỗi ngày bạn hiểu tính năng đó từ database tới giao diện, thay vì học hết backend rồi mới sang frontend.

Mỗi ngày khoảng 2–3 giờ. Học xong thì trả lời 3 câu **Tự kiểm tra**; câu nào chưa trả lời được thì hỏi Claude giải thích phần đó.

Tài liệu đi kèm:
- [API.md](API.md): API nhận gì, trả gì.
- [frontend-schemas.md](frontend-schemas.md): ý nghĩa từng trường trong schema frontend.
- [course-map.md](course-map.md): bài nào của khóa học tương ứng với phần nào, cần đổi gì.

Ký hiệu: ✅ frontend đã có · 🔲 cần làm.

## Tổng quan

| Ngày | Chủ đề | Kết quả ở frontend |
|---|---|---|
| 1 | Chạy dự án, đường đi của một request | |
| 2 | Đăng nhập, đăng ký, JWT | ✅ `/login`, `/register` |
| 3 | Phân quyền: role và permission | ✅ menu theo role, `proxy.ts` |
| 4 | Đăng xuất | 🔲 nút đăng xuất, trang `/logout` |
| 5 | Refresh token | 🔲 tự làm mới token, trang `/refresh-token` |
| 6 | Danh mục: module CRUD đơn giản nhất | |
| 7 | Danh sách khóa học công khai | 🔲 `/courses` |
| 8 | Trang chi tiết khóa học | 🔲 `/courses/[slug]` |
| 9 | Ghi danh và tiến độ | 🔲 nút ghi danh, `/my-courses` |
| 10 | Bài giảng và quyền xem | 🔲 `/learn/[courseId]` |
| 11 | Đánh giá | 🔲 form đánh giá |
| 12 | Hồ sơ và upload file | 🔲 `/profile` |
| 13 | Đổi mật khẩu, quên mật khẩu, hàng đợi email | 🔲 đổi mật khẩu, `/forgot-password` |
| 14 | Giảng viên: quản lý khóa học | 🔲 `/instructor`, `/instructor/courses` |
| 15 | Soạn chương và bài giảng | 🔲 trang soạn khóa |
| 16 | Admin: duyệt khóa học | 🔲 `/admin/courses` |
| 17 | Admin: người dùng, danh mục, thống kê | 🔲 `/admin`, `/admin/users`, `/admin/categories` |
| 18 | Admin: role và permission | 🔲 `/admin/roles` (tùy chọn) |
| 19 | Backend chạy thật: bảo mật, log, job nền, test | |
| 20 | SEO, cache trang công khai, tổng kết | 🔲 metadata, sitemap |

---

## Giai đoạn 1: Nền tảng (ngày 1–5)

### Ngày 1: Chạy dự án, đường đi của một request

**Mục tiêu:** chạy được cả hệ thống và vẽ lại được đường đi của một request từ trình duyệt tới database.

- **Đọc:** `README.md`, `backend/docker-compose.yml` (PostgreSQL, Redis, Mailpit), `backend/.env.example`, `backend/prisma/schema.prisma` (chạy *Prisma Generate UML* để xem sơ đồ), `backend/src/server.ts`, `backend/src/app.ts`.
- **Đọc theo một request:** `GET /categories` đi qua `app.ts` → `modules/category/category.route.ts` → `category.controller.ts` → `category.service.ts` → Prisma → `middleware/error.middleware.ts` khi có lỗi.
- **Thử:** `docker compose up -d`, `npm run seed`, `npm run seed:demo`, `npm run dev`; gọi `GET /categories` bằng Postman.
- **Frontend:** đọc cấu trúc `frontend/src`: `app/`, `schemaValidations/`, `apiRequests/`, `queries/`, `lib/http.ts`.

**Tự kiểm tra**
1. Route, controller, service mỗi tầng làm việc gì? Vì sao không viết hết vào một chỗ?
2. Service ném `HttpError(404, ...)` thì ai bắt và trả JSON về cho client?
3. Redis và Mailpit trong `docker-compose.yml` dùng để làm gì?

### Ngày 2: Đăng nhập, đăng ký, JWT

**Mục tiêu:** hiểu token được tạo, lưu, kiểm tra thế nào ở cả 3 nơi: backend, server Next, trình duyệt.

- **Backend:** `modules/auth/*`, `utils/jwt.ts`, `utils/crypto.ts` (bcrypt), `middleware/auth.middleware.ts` (`requireAuth`), `middleware/validate.middleware.ts`.
- **Thử:** Postman: đăng ký, đăng nhập, `GET /auth/me` có và không có token, sai mật khẩu (401).
- **Frontend ✅:** `app/(public)/(auth)/login`, `register`, `app/api/auth/login/route.ts`, `apiRequests/auth.ts`, `lib/http.ts`.
- **Khóa học:** ghi chú `client/authentication.md`, `stateful-stateless.md`.

**Tự kiểm tra**
1. Vì sao đăng ký phải tạo user và refresh token trong **cùng một transaction**?
2. Vì sao sai email và sai mật khẩu trả **cùng một câu báo lỗi**?
3. Token được lưu ở 3 chỗ nào sau khi đăng nhập, và mỗi chỗ phục vụ ai?

### Ngày 3: Phân quyền (role và permission)

**Mục tiêu:** hiểu vì sao học viên gọi API admin bị 403, và frontend ẩn/chặn giao diện ra sao.

- **Backend:** `middleware/auth.middleware.ts` (`requirePermission`), `constants/default-permissions.ts`, `constants/role.ts`, `utils/permission-path.ts`, `scripts/sync-permissions.ts`, `modules/role/*`, `modules/permission/*`.
- **Thử:** đăng nhập bằng học viên rồi gọi `POST /categories` (403); xem `GET /roles/3` để thấy danh sách quyền của STUDENT.
- **Frontend ✅:** `components/app-provider.tsx`, `app/(public)/nav-items.tsx`, `proxy.ts`.
- **Khóa học:** `client/role-based-vs-permission-based.md`.

**Tự kiểm tra**
1. `npm run sync-permissions` sinh permission từ đâu?
2. Giảng viên có quyền `PUT /courses/:id`, vì sao vẫn không sửa được khóa của người khác?
3. Tự sửa role trong localStorage thành `ADMIN` thì thấy được gì, và gọi được API admin không?

### Ngày 4: Đăng xuất

- **Backend:** `logout` trong `modules/auth/auth.service.ts`: xóa refresh token khỏi DB.
- **Frontend 🔲:** Route Handler `app/api/auth/logout/route.ts`; `authApiRequest.logout` / `sLogout`; menu avatar trên header (tên người dùng + nút Đăng xuất); trang `/logout` cho trường hợp server gặp 401.
- **Khóa học:** `client/src/app/api/auth/logout/route.ts`, `manage/dropdown-avatar.tsx`, `(auth)/login/logout.tsx`. Khác Edu: không cần header `Authorization` (xem `course-map.md` mục 3.3).

**Tự kiểm tra**
1. Vì sao chỉ xóa token ở trình duyệt mà không gọi API logout là chưa đủ?
2. Route Handler logout lỗi khi gọi backend thì có nên trả lỗi cho trình duyệt không?
3. `setRole()` không truyền tham số làm những gì?

### Ngày 5: Refresh token

- **Backend:** `refreshToken` trong `auth.service.ts`: xoay vòng token, vì sao mỗi refresh token chỉ dùng được một lần.
- **Thử:** Postman: refresh 2 lần bằng **cùng một** refresh token → lần 2 nhận 401.
- **Frontend 🔲:** `app/api/auth/refresh-token/route.ts`, `checkAndRefreshToken` trong `lib/utils.ts`, component `RefreshToken` chạy định kỳ, trang `/refresh-token`, sửa `proxy.ts` dùng cookie `refreshToken` cho `isAuth`.
- **Khóa học:** `client/refresh-token.md` (đọc kỹ 5 lưu ý), `components/refresh-token.tsx`. Khác Edu: `course-map.md` mục 3.1, 3.2.

**Tự kiểm tra**
1. Vì sao refresh khi access token còn **1/3** thời gian sống, không đợi hết hạn?
2. Hai tab cùng refresh một lúc thì chuyện gì xảy ra? Chặn bằng cách nào?
3. Vì sao `proxy.ts` phải đọc role từ access token chứ không từ refresh token?

---

## Giai đoạn 2: Phía học viên (ngày 6–13)

### Ngày 6: Danh mục, module CRUD đơn giản nhất

**Mục tiêu:** nắm khuôn mẫu chung mà mọi module đều lặp lại.

- **Backend:** `modules/category/*` (đủ 4 file), `utils/pagination.ts`, xóa mềm (`deletedAt`), migration `partial_unique_indexes` (vì sao tên trùng với danh mục đã xóa vẫn tạo được).
- **Thử:** các request trong tài liệu "Test Category API bằng Postman".
- **Frontend:** đọc `schemaValidations/category.schema.ts`, `common.schema.ts`.

**Tự kiểm tra**
1. Xóa mềm khác xóa thật thế nào? Vì sao không xóa thật?
2. `PaginationQuery` dùng `z.coerce.number()` vì sao?
3. Vì sao không xóa được danh mục còn khóa học?

### Ngày 7: Danh sách khóa học công khai

- **Backend:** `getPublicCourses` trong `modules/course/course.service.ts`: điều kiện lọc, sắp xếp `popular` theo số học viên, ghép điểm đánh giá từ `review.service.ts` (`getRatingByCourse`).
- **Frontend 🔲:** trang `/courses` render ở server: đọc `searchParams` bằng `GetCoursesQuery`, thẻ khóa học, ô tìm kiếm, bộ lọc danh mục / trình độ / giá, phân trang (`AutoPagination` của khóa học).

**Tự kiểm tra**
1. Vì sao trang này nên render ở **server** chứ không ở client?
2. `averageRating` được tính trong một câu query hay nhiều câu? Vì sao?
3. Đổi bộ lọc thì URL thay đổi thế nào, và tại sao nên giữ bộ lọc trên URL?

### Ngày 8: Trang chi tiết khóa học

- **Backend:** `getPublicCourseById`: `optionalAuth` (có token thì biết `isEnrolled`), ẩn `videoUrl` của bài không xem thử, `distribution` sao.
- **Frontend 🔲:** `/courses/[slug]` với slug `ten-khoa-i.15`, `generateMetadata`, mục lục chương / bài, khối đánh giá (`GET /reviews?courseId`).
- **Khóa học:** `(public)/dishes/[slug]/page.tsx`, `generateSlugUrl`, `getIdFromSlugUrl`, `wrapServerApi`, `cache()`.

**Tự kiểm tra**
1. `isEnrolled` có 3 giá trị (`null`, `true`, `false`), mỗi giá trị hiện nút gì?
2. Vì sao backend trả `videoUrl: null` cho bài không phải xem thử, thay vì để frontend tự ẩn?
3. `cache()` của React giúp gì khi cả `generateMetadata` lẫn trang đều cần dữ liệu khóa học?

### Ngày 9: Ghi danh và tiến độ

- **Backend:** `modules/enrollment/*`: ghi danh (402 khóa có phí, 409 trùng / là giảng viên), cách tính `percent`, `getMyLearning`.
- **Frontend 🔲:** nút Ghi danh ở trang chi tiết (`useMutation` + `invalidateQueries`), trang `/my-courses` (thẻ khóa + thanh tiến độ).

**Tự kiểm tra**
1. Vì sao `percent` tính ở backend chứ không ở frontend?
2. Ghi danh xong, làm sao nút đổi thành "Vào học" mà không phải tải lại trang?
3. Giảng viên ghi danh khóa của chính mình thì sao?

### Ngày 10: Bài giảng và quyền xem

- **Backend:** `getLectureForLearner` trong `modules/lecture/lecture.service.ts` (ai được xem bài nào), `completeLecture` / `uncompleteLecture` trong `modules/enrollment/enrollment.service.ts` (`upsert`; route nằm ở `lecture.route.ts` nhưng logic thuộc phần tiến độ học).
- **Thử:** học viên chưa ghi danh mở bài không phải xem thử → 403.
- **Frontend 🔲:** `/learn/[courseId]`: mục lục bên trái (dấu ✓), video bên phải, nút "Đánh dấu đã học", tiến độ cập nhật.

**Tự kiểm tra**
1. Có mấy trường hợp được xem một bài giảng?
2. Vì sao "đánh dấu đã học" dùng `upsert` và gọi nhiều lần không sao?
3. Video phát được tua nhờ cơ chế gì của server (`Range`)?

### Ngày 11: Đánh giá

- **Backend:** `modules/review/*`: phải ghi danh mới đánh giá, mỗi khóa một lần, tác giả hoặc admin mới xóa được, `getRatingSummary`.
- **Frontend 🔲:** form đánh giá (chọn sao + bình luận) dùng `MyReviewRes`: `null` thì form Viết, có dữ liệu thì form Sửa.

**Tự kiểm tra**
1. "Mỗi khóa một lần" được đảm bảo ở tầng nào: code, database hay cả hai?
2. Sửa đánh giá xong, những query nào cần `invalidateQueries`?
3. Admin xóa đánh giá của người khác: kiểm tra quyền ở đâu?

### Ngày 12: Hồ sơ và upload file

- **Backend:** `modules/profile/*`, `modules/upload/*`, `middleware/upload.middleware.ts`, `utils/file-signature.ts` (kiểm tra nội dung file thật, không tin đuôi file), giới hạn dung lượng (413).
- **Thử:** upload ảnh thật; đổi đuôi file `.txt` thành `.jpg` rồi upload → 422.
- **Frontend 🔲:** `/profile`: sửa tên, số điện thoại, ảnh đại diện (xem trước bằng `URL.createObjectURL`, upload rồi mới lưu hồ sơ).
- **Khóa học:** `manage/setting/update-profile-form.tsx`. Khác Edu: `course-map.md` mục 3.5.

**Tự kiểm tra**
1. Vì sao không tin đuôi file mà phải đọc vài byte đầu của file?
2. Vì sao upload ảnh trước, lấy URL rồi mới gửi `PUT /profile`?
3. Gửi `avatar: null` khác không gửi `avatar` thế nào?

### Ngày 13: Đổi mật khẩu, quên mật khẩu, hàng đợi email

- **Backend:** `PUT /profile/password` (đăng xuất mọi thiết bị khác, trả cặp token mới), `forgotPassword` / `resetPassword` trong `auth.service.ts` (OTP 10 phút, 5 lần sai), `queues/email.queue.ts`, `queues/workers.ts`, `src/worker.ts`, `lib/mailer.ts`, `emails/templates.ts`.
- **Thử:** chạy `npm run worker`, gọi quên mật khẩu, mở `http://localhost:8025` xem mã OTP.
- **Frontend 🔲:** form đổi mật khẩu + Route Handler ghi đè cookie (`course-map.md` mục 3.6), trang `/forgot-password`, `/reset-password`.

**Tự kiểm tra**
1. Vì sao gửi email qua **hàng đợi** thay vì gửi ngay trong request?
2. Vì sao quên mật khẩu **luôn trả 200**, kể cả khi email không tồn tại?
3. Đổi mật khẩu xong mà không cập nhật cookie thì lần refresh sau chuyện gì xảy ra?

---

## Giai đoạn 3: Giảng viên và admin (ngày 14–18)

### Ngày 14: Giảng viên quản lý khóa học

- **Backend:** phần giảng viên trong `course.service.ts`: chỉ sửa / xóa khi `DRAFT` / `REJECTED`, kiểm tra chủ sở hữu, `submitCourse` (cần ≥ 1 bài), danh sách học viên; `modules/stats` (`/stats/instructor`).
- **Frontend 🔲:** layout khu giảng viên (sidebar + avatar), dashboard, bảng `/instructor/courses` **phân trang ở server**, dialog tạo / sửa khóa (upload thumbnail).
- **Khóa học:** `manage/layout.tsx`, `manage/dishes/*`. Khác Edu: `course-map.md` mục 3.4.

**Tự kiểm tra**
1. Vẽ sơ đồ trạng thái khóa học: `DRAFT → PENDING → PUBLISHED / REJECTED`, ai đổi được bước nào?
2. Vì sao bảng Edu không dùng `getPaginationRowModel` như khóa học?
3. `queryKey` của danh sách nên chứa những gì để đổi trang thì tải đúng trang?

### Ngày 15: Soạn chương và bài giảng

- **Backend:** `modules/section/*`, `modules/lecture/*`: `position` (thêm vào cuối), đổi thứ tự trong transaction, xóa chương thì xóa luôn bài; upload video.
- **Frontend 🔲:** trang `/instructor/courses/[courseId]`: thêm / sửa / xóa chương và bài, đổi thứ tự, upload video, nút Gửi duyệt.

**Tự kiểm tra**
1. Vì sao đổi thứ tự phải nằm trong **transaction**?
2. Chương mới lấy `position` bằng cách nào?
3. Khóa đang `PENDING` thì có sửa chương được không? Vì sao?

### Ngày 16: Admin duyệt khóa học

- **Backend:** `getPendingCourses`, `getCourseForAdmin`, `approveCourse`, `rejectCourse`, `unpublishCourse` trong `course.service.ts`.
- **Frontend 🔲:** layout khu admin, `/admin/courses` (lọc theo trạng thái), `/admin/courses/[courseId]` (xem trước nội dung, Duyệt / Từ chối kèm lý do).

**Tự kiểm tra**
1. Duyệt một khóa không ở `PENDING` thì backend trả gì?
2. `rejectReason` hiện ở đâu cho giảng viên thấy?
3. Sau khi duyệt, trang công khai `/courses` cập nhật thế nào?

### Ngày 17: Admin quản lý người dùng, danh mục, thống kê

- **Backend:** `modules/user/*` (khóa user → thu hồi mọi refresh token, đổi role, không tự khóa chính mình), `modules/stats` (`/stats/admin`), `modules/category`.
- **Frontend 🔲:** `/admin` (dashboard + biểu đồ), `/admin/users` (tìm kiếm, khóa / mở, đổi role), `/admin/categories` (CRUD).
- **Khóa học:** `manage/dashboard/*` (recharts), `manage/accounts/*`.

**Tự kiểm tra**
1. Khóa một user đang đăng nhập: request tiếp theo của họ nhận gì, vì sao có hiệu lực ngay?
2. Vì sao không cho admin tự khóa chính mình?
3. Đổi học viên thành giảng viên: menu của người đó đổi khi nào?

### Ngày 18: Admin role và permission (tùy chọn)

- **Backend:** `modules/role/*` (`permissionIds` thay toàn bộ, không sửa được ADMIN), `modules/permission/*`.
- **Frontend 🔲:** `/admin/roles`: danh sách role, tick chọn permission. Lưu ý `CreateRoleBody` dùng `.transform()` (xem `frontend-schemas.md` mục 12).

**Tự kiểm tra**
1. Vì sao `PUT /roles/:id` bắt buộc gửi `permissionIds`?
2. Tạo role mới `ASSISTANT` thì `nav-items.tsx` và `proxy.ts` có cần sửa không?
3. RBAC trong Edu khác PBAC trong ghi chú của khóa học ở đâu?

---

## Giai đoạn 4: Hoàn thiện (ngày 19–20)

### Ngày 19: Backend chạy thật

- **Đọc:** `middleware/rate-limit.middleware.ts` (và vấn đề IP khi đi qua server Next), helmet và log trong `app.ts`, `queues/maintenance.queue.ts` (dọn token hết hạn), `tests/*` (Vitest + Supertest), `.github/workflows/backend.yml`.
- **Thử:** `npm test`, đọc `tests/course-flow.test.ts` như một kịch bản người dùng hoàn chỉnh.

**Tự kiểm tra**
1. Rate limit đăng nhập đếm lần đúng hay lần sai? Vì sao?
2. Test `course-flow` đi qua những API nào, theo thứ tự nào?
3. CI chạy khi nào và kiểm tra những gì?

### Ngày 20: SEO, cache và tổng kết

- **Frontend 🔲:** metadata + Open Graph cho trang khóa học, `app/sitemap.ts`, `app/robots.ts`; cache trang công khai bằng `'use cache'` + `cacheTag`, `revalidateTag(tag, 'max')` khi admin duyệt (`course-map.md` mục 3.7).
- **Khóa học:** `client/SEO-Checlist.md`, `app/sitemap.ts`, `app/robots.ts`.
- **Tổng kết:** tự vẽ lại toàn bộ luồng "giảng viên tạo khóa → admin duyệt → học viên tìm thấy, ghi danh, học, đánh giá" và chỉ ra mỗi bước gọi API nào, kiểm tra quyền ở đâu.

**Tự kiểm tra**
1. "View source" trang chi tiết khóa học có thấy tên khóa không? Vì sao điều đó quan trọng cho SEO?
2. Cache trang công khai lợi gì, và rủi ro gì nếu quên `revalidateTag`?
3. Nếu phải giải thích dự án cho nhà tuyển dụng trong 2 phút, bạn nói gì?
