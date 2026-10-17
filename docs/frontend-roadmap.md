# Lộ trình làm frontend

Danh sách việc cần làm để hoàn thành frontend Edu Platform, chia thành 7 mốc. Mỗi mốc kết thúc bằng một phần **dùng được thật** (người dùng thao tác được từ đầu tới cuối), kèm điều kiện "Xong khi" để tự kiểm tra.

Tài liệu đi kèm:
- [study-plan.md](study-plan.md): học hiểu backend của từng tính năng (đọc ngày tương ứng trước khi làm).
- [course-map.md](course-map.md): bài nào của khóa học dùng được, cần đổi gì.
- [API.md](API.md), [frontend-schemas.md](frontend-schemas.md).

Trạng thái ngày 15/10/2026: `[x]` đã xong · `[ ]` chưa làm.

## Tổng quan

| Mốc | Nội dung | Kết quả dùng được | Học trước (study-plan) |
|---|---|---|---|
| 0 | Nền tảng | Đăng nhập, đăng ký, layout công khai, layout admin | Ngày 1–3 |
| 1 | Hoàn thiện xác thực | Đăng xuất, giữ đăng nhập lâu dài, quên mật khẩu | Ngày 4, 5, 13 |
| 2 | Trang công khai | Khách tìm và xem khóa học | Ngày 6–8, 11 |
| 3 | Học viên | Ghi danh, học, đánh giá, sửa hồ sơ | Ngày 9–13 |
| 4 | Giảng viên | Tạo khóa, soạn bài, gửi duyệt | Ngày 14, 15 |
| 5 | Admin | Duyệt khóa, quản lý danh mục và người dùng | Ngày 16–18 |
| 6 | Hoàn thiện | SEO, trạng thái tải / lỗi, sẵn sàng deploy | Ngày 19, 20 |

## Quy trình làm một trang

Mỗi trang đều đi theo 5 bước, theo thứ tự:

1. **Schema** (`schemaValidations/`): Body / Query copy từ backend, Res viết theo response thật.
2. **API** (`apiRequests/`): mỗi API một hàm, dùng `http.get/post/put/delete<ResType>`.
3. **Hook** (`queries/`): đọc dữ liệu dùng `useQuery` (`queryKey` chứa đủ tham số), ghi dữ liệu dùng `useMutation` + `invalidateQueries`.
4. **Giao diện**: form dùng `Controller` + `Field`; lỗi dùng `handleErrorApi` (422 gắn vào ô, còn lại toast).
5. **Kiểm tra**: thử bằng tài khoản đúng role và **sai role**, thử trường hợp lỗi giống khi test Postman.

Trang cần SEO hoặc hiện ngay khi mở (danh sách, chi tiết khóa học) thì lấy dữ liệu ở **Server Component**. Trang sau khi đăng nhập (học, quản lý) thì dùng React Query ở **Client Component**.

---

## Mốc 0: Nền tảng ✅

- [x] `lib/http.ts`: fetch wrapper, `HttpError` / `EntityError`, 401 của login/register không tự logout
- [x] `schemaValidations/`: auth, category, course, section, lecture, enrollment, review, role, permission, common
- [x] `components/app-provider.tsx`: React Query + Context `role` / `isAuth` / `setRole`
- [x] Layout gốc: font Be Vietnam Pro, giao diện sáng/tối, `Toaster`
- [x] Layout công khai `(public)`: header, menu theo role, menu điện thoại, footer
- [x] `/login`, `/register` + Route Handler `api/auth/login`, `api/auth/register`
- [x] `proxy.ts` bản đầu: chặn theo đăng nhập (cookie `accessToken`) và theo role
- [x] Layout admin: sidebar, header, `AccountBadge`

---

## Mốc 1: Hoàn thiện xác thực

**Học trước:** study-plan ngày 4, 5, 13 · course-map mục 3.1–3.3

### Đăng xuất
- [x] Route Handler `app/api/auth/logout/route.ts`: đọc refresh token từ cookie, xóa 2 cookie, gọi backend, **luôn trả 200**
- [x] `authApiRequest.logout` / `sLogout`, `useLogoutMutation`
- [x] Cài `dropdown-menu`; biến `AccountBadge` thành menu: Hồ sơ, Về trang chủ / Vào trang quản trị, **Đăng xuất**
- [x] Header công khai: khi đã đăng nhập thì hiện menu tài khoản thay cho "Đăng nhập / Đăng ký"
- [x] Trang `/logout` (cho trường hợp Server Component gặp 401)

### Giữ đăng nhập (refresh token)
- [x] Route Handler `app/api/auth/refresh-token/route.ts`
- [x] `authApiRequest.refreshToken` có **chống gọi trùng** (một promise dùng chung)
- [x] `checkAndRefreshToken` trong `lib/utils.ts`, component `RefreshToken` đặt trong `AppProvider`
- [x] Trang `/refresh-token?redirect=...`
- [x] `proxy.ts`: `isAuth` theo cookie `refreshToken`; mất access token thì chuyển sang `/refresh-token`

### Quên mật khẩu
- [ ] Schema `ForgotPasswordBody`, `ResetPasswordBody` (copy từ `backend/.../auth.schema.ts`)
- [ ] Trang `/forgot-password` (nhập email) → `/reset-password` (mã OTP + mật khẩu mới) → `/login`
- [ ] Link "Quên mật khẩu?" ở form đăng nhập

**Xong khi:**
- Đăng nhập, để yên **20 phút**, bấm sang trang khác: vẫn còn đăng nhập.
- Đăng xuất: cookie, localStorage và refresh token trong DB đều bị xóa; vào `/my-courses` bị đưa về `/login`.
- Quên mật khẩu với mã OTP lấy ở `http://localhost:8025`, đăng nhập được bằng mật khẩu mới.

---

## Mốc 2: Trang công khai

**Học trước:** study-plan ngày 6–8, 11 · course-map mục "Trang công khai"

### Chuẩn bị
- [x] `apiRequests/course.ts`, `category.ts`, `review.ts` (phần công khai)
- [x] Cài `badge`, `select`, `skeleton` (phân trang tự viết bằng link: `courses/course-pagination.tsx`)
- [x] Hàm dùng chung trong `lib/format.ts`: `formatPrice` (`0` → "Miễn phí", còn lại `199.000 ₫`), `formatDuration` (giây → "2 giờ 15 phút"), `generateSlugUrl` / `getIdFromSlugUrl`
- [x] Component `CourseCard`, `RatingStars`, `CourseThumbnail`

### Trang
- [x] `/courses`: tìm kiếm, lọc danh mục / trình độ / giá, sắp xếp, phân trang; **mọi bộ lọc nằm trên URL**
- [x] `/courses/[slug]`: thông tin khóa, mục lục (chương / bài, bài xem thử), giảng viên, khối đánh giá + phân bố sao, `generateMetadata`
- [ ] Trang chủ: khóa nổi bật (`GET /courses?sort=popular&limit=8`), danh mục

**Xong khi:**
- Lọc "Miễn phí" + "Lập trình Web", sao chép URL mở ở tab khác vẫn đúng kết quả.
- "View source" trang chi tiết thấy được tên và mô tả khóa học.
- Khóa chưa xuất bản hoặc slug sai → trang 404 đẹp, không lỗi trắng.

---

## Mốc 3: Học viên

**Học trước:** study-plan ngày 9–13 · course-map mục 3.5, 3.6

### Ghi danh và học
- [ ] `apiRequests/enrollment.ts`, `lecture.ts` (phần học viên), hook tương ứng
- [ ] Nút trên trang chi tiết theo `isEnrolled`: `null` → "Đăng nhập để học", `false` → "Ghi danh", `true` → "Vào học"; khóa có phí → thông báo chưa hỗ trợ thanh toán (402)
- [ ] `/my-courses`: thẻ khóa + thanh tiến độ (cài `progress`)
- [ ] `/learn/[courseId]`: mục lục bên trái (✓ bài đã xong), video + nội dung bên phải, nút "Đánh dấu đã học", tự cập nhật tiến độ

### Đánh giá
- [ ] Form chọn sao + bình luận theo `MyReviewRes`: `null` → Viết, có dữ liệu → Sửa / Xóa

### Hồ sơ
- [ ] Schema `UpdateProfileBody`, `ChangePasswordBody` + Res trả cặp token mới; schema upload (`data.url`)
- [ ] `apiRequests/profile.ts` (thay cho `account.ts` của khóa học: Edu không có `/accounts`), `apiRequests/upload.ts`
- [ ] `/profile`: sửa tên, số điện thoại, ảnh đại diện (xem trước → upload → lưu)
- [ ] Đổi mật khẩu + Route Handler ghi đè cookie bằng token mới

**Xong khi:**
- Học viên mới: tìm khóa → ghi danh → học hết 1 bài → tiến độ tăng → viết đánh giá → đánh giá hiện ở trang chi tiết.
- Đổi ảnh đại diện: ảnh mới hiện ngay trên header, không cần tải lại trang.
- Đổi mật khẩu xong vẫn dùng tiếp được (không bị đá ra sau 15 phút).

---

## Mốc 4: Giảng viên

**Học trước:** study-plan ngày 14, 15 · course-map mục 3.4

### Khung
- [ ] Layout `/instructor` (chép từ layout admin, menu riêng: Dashboard, Khóa học của tôi)
- [ ] Bổ sung schema: `GetCourseStudentsQuery` + Res, `ReorderSectionsBody`, `ReorderLecturesBody`, `InstructorStatsRes`

### Trang
- [ ] `/instructor`: số khóa theo trạng thái, tổng học viên, điểm đánh giá, top khóa (`GET /stats/instructor`)
- [ ] `/instructor/courses`: bảng (cài `table`), lọc trạng thái, **phân trang ở server**, badge trạng thái, hiện `rejectReason`
- [ ] Tạo / sửa khóa: form (cài `textarea`), chọn danh mục, upload thumbnail; chỉ sửa được khi `DRAFT` / `REJECTED`
- [ ] `/instructor/courses/[courseId]`: soạn chương / bài (thêm, sửa, xóa, đổi thứ tự), upload video, đánh dấu bài xem thử, nút **Gửi duyệt**
- [ ] `/instructor/courses/[courseId]/students`: học viên + tiến độ

**Xong khi:**
- Giảng viên tạo khóa mới → thêm 2 chương, 3 bài có video → gửi duyệt → khóa chuyển `PENDING` và không sửa được nữa.
- Giảng viên khác mở URL khóa này: bị chặn (403), không lộ nội dung.

---

## Mốc 5: Admin

**Học trước:** study-plan ngày 16–18

### Chuẩn bị
- [ ] Bổ sung schema: `GetAdminCoursesQuery`, `UnpublishCourseBody`, `AdminStatsRes`, user (`GetUsersQuery`, `UpdateUserStatusBody`, `UpdateUserRoleBody`, `UserListRes`, `UserDetailRes`)
- [ ] Cài `dialog`, `alert-dialog`, `tabs`, `chart` (recharts)

### Trang
- [ ] `/admin`: thẻ số liệu + biểu đồ (`GET /stats/admin`)
- [ ] `/admin/courses`: tab Chờ duyệt / Tất cả; `/admin/courses/[courseId]`: xem trước nội dung, Duyệt / Từ chối (nhập lý do) / Gỡ
- [ ] `/admin/categories`: bảng + dialog thêm / sửa, xóa có xác nhận (409 khi còn khóa học)
- [ ] `/admin/users`: tìm kiếm, lọc role / trạng thái, Khóa / Mở, đổi role
- [ ] `/admin/roles` (tùy chọn): danh sách role, tick chọn permission
- [ ] `lib/http.ts`: nhận 403 với thông báo "Tài khoản của bạn đã bị khoá" thì **đăng xuất luôn** (hiện chỉ hiện toast; backend trả 403, không phải 401, cho mọi request của người bị khóa)

**Xong khi:**
- Admin duyệt khóa của mốc 4 → khóa xuất hiện ở `/courses`; từ chối → giảng viên thấy lý do.
- Khóa một học viên đang đăng nhập → ở thao tác tiếp theo người đó thấy thông báo bị khóa và bị đăng xuất.

---

## Mốc 6: Hoàn thiện

**Học trước:** study-plan ngày 19, 20 · course-map mục 3.7

- [ ] `loading.tsx` (skeleton), `error.tsx`, `not-found.tsx` cho các khu
- [ ] Trạng thái rỗng: chưa ghi danh khóa nào, chưa có đánh giá, không tìm thấy khóa
- [ ] SEO: Open Graph cho trang khóa học, `app/sitemap.ts`, `app/robots.ts`
- [ ] Cache trang công khai: `'use cache'` + `cacheTag('courses')`, `revalidateTag('courses', 'max')` khi admin duyệt / gỡ
- [ ] Kiểm tra trên điện thoại (360px) từng trang
- [ ] Trước khi deploy: biến môi trường thật, gửi IP người dùng qua Route Handler cho rate limit (course-map mục 1, rate limit)

**Xong khi:**
- Chạy `npm run build` không lỗi.
- Mạng chậm (DevTools → Network → Slow 4G): trang nào cũng có skeleton, không nhảy bố cục.
- Toàn bộ kịch bản "giảng viên tạo khóa → admin duyệt → học viên học và đánh giá" chạy được trên giao diện, không cần Postman.
