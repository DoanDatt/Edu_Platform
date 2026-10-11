# Edu Platform – Tài liệu API

Tài liệu dành cho người làm frontend: gọi API nào, gửi gì, nhận gì, lỗi nào cần xử lý.

- **Base URL (dev):** `http://localhost:4000`
- **Định dạng:** JSON (`Content-Type: application/json`)
- **CORS:** mặc định cho phép `http://localhost:5173` (Vite) và `http://localhost:3000` (Next.js). Đổi bằng biến `CORS_ORIGINS` trong `backend/.env`.

---

## 1. Quy ước chung

### Response thành công

Một đối tượng:
```json
{ "message": "Lấy khóa học thành công", "data": { "id": 1, "title": "..." } }
```

Danh sách có phân trang (mọi API danh sách đều cùng dạng):
```json
{
  "message": "Lấy danh sách khóa học thành công",
  "data": [ { "id": 1 }, { "id": 2 } ],
  "totalItems": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```
Query phân trang: `?page=1&limit=10`. `page` ≥ 1 (mặc định 1), `limit` từ 1 đến 100 (mặc định 10).

### Response lỗi

```json
{ "message": "Dữ liệu không hợp lệ", "errors": [ { "field": "email", "message": "Email không hợp lệ" } ] }
```
`errors` chỉ có ở lỗi **422**: hiện từng `message` dưới đúng ô input theo `field`. Các lỗi khác chỉ có `message`.

| Mã | Ý nghĩa | Frontend nên làm |
|---|---|---|
| 400 | Body không phải JSON hợp lệ | Lỗi code phía frontend |
| 401 | Chưa đăng nhập / access token sai hoặc hết hạn | Gọi refresh token (mục 2), thất bại thì chuyển về trang đăng nhập |
| 402 | Khóa học có phí, chưa hỗ trợ thanh toán | Hiện thông báo "sắp ra mắt" |
| 403 | Đã đăng nhập nhưng không có quyền / không phải chủ sở hữu | Hiện thông báo, ẩn nút tương ứng |
| 404 | Không tìm thấy (hoặc chưa xuất bản) | Trang 404 |
| 409 | Xung đột trạng thái: trùng, đã ghi danh, khóa đang chờ duyệt... | Hiện `message` |
| 422 | Dữ liệu gửi lên sai | Hiện lỗi theo `errors[].field` |
| 500 | Lỗi server | Thông báo chung "thử lại sau" |

**Lưu ý:** body và query có `.strict()`: gửi **thừa field** (ví dụ `id`, `status`, `instructorId`) sẽ bị **422**. Chỉ gửi đúng các field ghi trong tài liệu.

### Enum

| Tên | Giá trị |
|---|---|
| `CourseLevel` | `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `ALL_LEVELS` |
| `CourseStatus` | `DRAFT` (nháp), `PENDING` (chờ duyệt), `PUBLISHED` (đã xuất bản), `REJECTED` (bị từ chối) |
| Role | `ADMIN`, `INSTRUCTOR`, `STUDENT` |

Giá tiền (`price`) là **VND, số nguyên**; `0` = miễn phí. Thời lượng (`durationSec`) tính bằng **giây**.

---

## 2. Xác thực

### Luồng token

```
POST /auth/login ──> { accessToken (15 phút), refreshToken (7 ngày) }
       │
       ├─ Mọi request cần đăng nhập: header  Authorization: Bearer <accessToken>
       │
       ├─ Nhận 401 → POST /auth/refresh-token { refreshToken }
       │      → cặp token MỚI. Refresh token cũ HẾT DÙNG ĐƯỢC (mỗi refresh token chỉ dùng 1 lần)
       │
       └─ Đăng xuất: POST /auth/logout { refreshToken } rồi xóa token phía client
```

> ⚠️ **Refresh token chỉ dùng được một lần.** Nếu trang gọi cùng lúc 3 API và cả 3 đều nhận 401, **chỉ được gọi refresh MỘT lần**, các request khác đợi kết quả rồi gọi lại. Nếu cả 3 cùng refresh bằng một token, 2 lần sau sẽ nhận 401 và người dùng bị đăng xuất. Cách làm phổ biến: trong interceptor (axios/fetch wrapper) giữ một biến `refreshPromise` dùng chung.

### Endpoint

| Method | Path | Body | Ghi chú |
|---|---|---|---|
| POST | `/auth/register` | `{ email, password, confirmPassword, name, phoneNumber }` | Tạo tài khoản **STUDENT**. 201 trả user (không có password). 409 nếu email đã dùng |
| POST | `/auth/login` | `{ email, password }` | `data: { accessToken, refreshToken }`. 401 sai email/mật khẩu, 403 tài khoản bị khóa |
| GET | `/auth/me` | | 🔒 Thông tin user + `role: { id, name }` → dùng để biết là ADMIN / INSTRUCTOR / STUDENT |
| POST | `/auth/refresh-token` | `{ refreshToken }` | `data: { accessToken, refreshToken }` (cặp mới) |
| POST | `/auth/logout` | `{ refreshToken }` | Không cần access token (vẫn đăng xuất được khi access token đã hết hạn) |

Ràng buộc đăng ký: `password` 8–100 ký tự, `confirmPassword` phải trùng, `phoneNumber` 9–15 ký tự, `name` 1–100 ký tự.

---

## 3. Phân quyền

Ký hiệu trong tài liệu:
- **Công khai**: không cần token.
- 🔒 **Đăng nhập**: cần token, mọi role.
- 🔑 **Có quyền**: cần token **và** role có permission tương ứng. Thiếu quyền → **403**.

Quyền mặc định (khai báo trong `backend/src/constants/default-permissions.ts`):

| Role | Được làm |
|---|---|
| **ADMIN** | Tất cả |
| **INSTRUCTOR** | Quản lý khóa học **của mình**, chương, bài giảng, gửi duyệt; **và** mọi quyền của người học |
| **STUDENT** | Ghi danh, học, đánh dấu hoàn thành, đánh giá |

Ngoài permission, service còn kiểm tra **chủ sở hữu**: giảng viên chỉ sửa được khóa của mình, học viên chỉ sửa được đánh giá của mình... Vi phạm thì trả **403**.

---

## 4. Danh mục

| Method | Path | Ai | Body / Query | Ghi chú |
|---|---|---|---|---|
| GET | `/categories` | Công khai | `?page&limit` | Sắp theo tên A→Z. Mỗi item `{ id, name, description }` |
| GET | `/categories/:categoryId` | Công khai | | |
| POST | `/categories` | 🔑 Admin | `{ name, description? }` | 409 nếu trùng tên (không phân biệt hoa thường) |
| PUT | `/categories/:categoryId` | 🔑 Admin | `{ name, description? }` | |
| DELETE | `/categories/:categoryId` | 🔑 Admin | | 409 nếu còn khóa học thuộc danh mục |

---

## 5. Khóa học – công khai

### `GET /courses`: danh sách khóa đã xuất bản

Query (đều không bắt buộc):

| Param | Ví dụ | Ý nghĩa |
|---|---|---|
| `search` | `react` | Tìm trong tên và mô tả ngắn, không phân biệt hoa thường |
| `categoryId` | `2` | Lọc theo danh mục |
| `level` | `BEGINNER` | Lọc theo trình độ |
| `price` | `free` / `paid` | Miễn phí / có phí |
| `sort` | `newest` (mặc định), `popular`, `price_asc`, `price_desc` | Sắp xếp |
| `page`, `limit` | | Phân trang |

Mỗi phần tử trong `data`:
```json
{
  "id": 1,
  "title": "React từ cơ bản đến nâng cao",
  "subtitle": "...",
  "thumbnail": "https://...",
  "price": 0,
  "level": "BEGINNER",
  "language": "vi",
  "publishedAt": "2026-10-10T08:00:00.000Z",
  "category": { "id": 1, "name": "Lập trình Web" },
  "instructor": { "id": 3, "name": "Nguyễn Văn An", "avatar": null },
  "studentCount": 2,
  "rating": { "averageRating": 4.5, "totalReviews": 2 }
}
```

### `GET /courses/:courseId`: trang chi tiết

Công khai. **Nếu gửi kèm token** thì có thêm thông tin `isEnrolled`.

```json
{
  "id": 1, "title": "...", "subtitle": "...", "description": "...", "thumbnail": "...",
  "price": 0, "level": "BEGINNER", "language": "vi", "publishedAt": "...",
  "category": { "id": 1, "name": "..." },
  "instructor": { "id": 3, "name": "...", "avatar": null },
  "sections": [
    {
      "id": 1, "title": "Giới thiệu",
      "lectures": [
        { "id": 1, "title": "React là gì?", "durationSec": 300, "isPreview": true,  "videoUrl": "https://..." },
        { "id": 2, "title": "Cài đặt",     "durationSec": 420, "isPreview": false, "videoUrl": null }
      ]
    }
  ],
  "studentCount": 2,
  "totalLectures": 8,
  "totalDurationSec": 3360,
  "rating": { "averageRating": 4.5, "totalReviews": 2, "distribution": { "1": 0, "2": 0, "3": 0, "4": 1, "5": 1 } },
  "isEnrolled": null
}
```
- `videoUrl` **chỉ có** ở bài xem thử (`isPreview: true`). Các bài còn lại phải ghi danh rồi lấy qua `GET /lectures/:lectureId`.
- `isEnrolled`: `null` = khách chưa đăng nhập; `true` = đã ghi danh, hiện nút **Vào học**; `false` = hiện nút **Ghi danh**.
- Khóa chưa xuất bản → **404**.

---

## 6. Khóa học – giảng viên

| Method | Path | Body / Query | Ghi chú |
|---|---|---|---|
| GET | `/courses/mine` | `?page&limit&status` | Khóa của tôi, mọi trạng thái, mới sửa nhất lên đầu |
| GET | `/courses/mine/:courseId` | | Chi tiết + **mục lục đầy đủ** (kể cả `content`, `videoUrl`) để soạn bài |
| POST | `/courses` | xem bên dưới | Tạo khóa, luôn ở `DRAFT` |
| PUT | `/courses/:courseId` | xem bên dưới | Chỉ khi `DRAFT` / `REJECTED` (ngược lại **409**) |
| DELETE | `/courses/:courseId` | | Chỉ khi `DRAFT` / `REJECTED` |
| POST | `/courses/:courseId/submit` | | Gửi duyệt: `DRAFT`/`REJECTED` → `PENDING`. Cần ít nhất 1 bài giảng (**409**) |

Tất cả đều 🔑 INSTRUCTOR (hoặc ADMIN). Khóa của người khác → **403**.

Body tạo / sửa khóa học:
```json
{
  "title": "React từ cơ bản",          // bắt buộc, 1–300
  "subtitle": "Mô tả ngắn",             // tùy chọn, ≤ 500
  "description": "Mô tả chi tiết...",   // tùy chọn, ≤ 20000
  "thumbnail": "https://...",           // tùy chọn, phải là URL (chưa có upload)
  "price": 199000,                      // bắt buộc, 0–100.000.000
  "level": "BEGINNER",                  // tùy chọn, mặc định ALL_LEVELS
  "language": "vi",                     // tùy chọn, mặc định "vi"
  "categoryId": 1                       // bắt buộc, danh mục còn hoạt động
}
```
`PUT` gửi lại các field như khi tạo. Field tùy chọn không gửi thì **giữ nguyên** giá trị cũ.

Khi khóa bị từ chối, `GET /courses/mine/:courseId` có `rejectReason` để hiển thị cho giảng viên sửa.

---

## 7. Chương & bài giảng (giảng viên soạn bài)

Chỉ sửa được khi khóa đang `DRAFT` / `REJECTED` và là khóa của mình. Mục mới luôn được thêm vào **cuối**. Đổi thứ tự bằng cách gửi `position` mới (số nhỏ đứng trước).

| Method | Path | Body |
|---|---|---|
| POST | `/sections` | `{ courseId, title }` |
| PUT | `/sections/:sectionId` | `{ title, position? }` |
| DELETE | `/sections/:sectionId` | Xóa luôn các bài giảng trong chương |
| POST | `/lectures` | `{ sectionId, title, videoUrl?, content?, durationSec?, isPreview? }` |
| PUT | `/lectures/:lectureId` | `{ title, videoUrl?, content?, durationSec?, isPreview?, position? }` |
| DELETE | `/lectures/:lectureId` | |

- `videoUrl`: URL video có sẵn (chưa có upload). `durationSec`: 0–86400. `isPreview: true` = ai cũng xem được.
- Muốn chuyển bài sang chương khác: xóa rồi tạo lại.

---

## 8. Duyệt khóa học (admin)

| Method | Path | Body | Ghi chú |
|---|---|---|---|
| GET | `/courses/pending` | `?page&limit` | Khóa chờ duyệt, gửi trước lên trước, kèm `instructor: { id, name, email }` |
| GET | `/courses/admin/:courseId` | | Chi tiết khóa ở **mọi** trạng thái + mục lục + giảng viên |
| POST | `/courses/:courseId/approve` | | `PENDING` → `PUBLISHED` |
| POST | `/courses/:courseId/reject` | `{ reason }` | `PENDING` → `REJECTED`, lưu lý do |

Khóa không ở `PENDING` → **409**.

---

## 9. Học viên: ghi danh và học

| Method | Path | Body | Ghi chú |
|---|---|---|---|
| POST | `/enrollments` | `{ courseId }` | Ghi danh. 409 nếu đã ghi danh / là giảng viên của khóa; **402** nếu khóa có phí; 404 nếu chưa xuất bản |
| GET | `/enrollments/mine` | `?page&limit` | Khóa đã ghi danh + tiến độ |
| GET | `/enrollments/mine/:courseId` | | Trang học: mục lục + bài nào đã xong. 403 nếu chưa ghi danh |
| GET | `/lectures/:lectureId` | | Nội dung bài (`videoUrl`, `content`). Xem được nếu: bài xem thử, **hoặc** đã ghi danh, **hoặc** là giảng viên của khóa / admin. Ngược lại **403** |
| POST | `/lectures/:lectureId/complete` | | Đánh dấu đã học xong (gọi nhiều lần không sao) |
| DELETE | `/lectures/:lectureId/complete` | | Bỏ đánh dấu |

`GET /enrollments/mine`, mỗi phần tử:
```json
{
  "enrolledAt": "2026-10-10T08:00:00.000Z",
  "course": { "id": 1, "title": "...", "subtitle": "...", "thumbnail": "...", "level": "BEGINNER", "instructor": { "id": 3, "name": "..." } },
  "progress": { "totalLectures": 8, "completedLectures": 4, "percent": 50 }
}
```

`GET /enrollments/mine/:courseId`:
```json
{
  "enrolledAt": "...",
  "course": {
    "id": 1, "title": "...", "subtitle": "...", "thumbnail": "...", "instructor": { "id": 3, "name": "..." },
    "sections": [
      { "id": 1, "title": "Giới thiệu", "lectures": [
        { "id": 1, "title": "React là gì?", "durationSec": 300, "isPreview": true, "completed": true }
      ] }
    ]
  },
  "progress": { "totalLectures": 8, "completedLectures": 4, "percent": 50 }
}
```
Gợi ý trang học: bên trái là mục lục (`completed` hiện dấu ✓), bên phải gọi `GET /lectures/:lectureId` để phát video. Sau khi xem xong, gọi `POST .../complete` rồi cập nhật `percent`.

---

## 10. Đánh giá

| Method | Path | Ai | Body / Query | Ghi chú |
|---|---|---|---|---|
| GET | `/reviews` | Công khai | `?courseId` (bắt buộc) `&page&limit` | Mới nhất trước, kèm `summary` (giống `rating` ở trang chi tiết). Mỗi item có `user: { id, name, avatar }` |
| GET | `/reviews/mine/:courseId` | 🔑 | | Đánh giá của tôi, chưa có thì `data: null` (dùng để hiện form "Viết" hay "Sửa") |
| POST | `/reviews` | 🔑 | `{ courseId, rating, comment? }` | Phải ghi danh trước (403). Mỗi khóa đánh giá một lần (409) |
| PUT | `/reviews/:reviewId` | 🔑 tác giả | `{ rating, comment? }` | |
| DELETE | `/reviews/:reviewId` | 🔑 tác giả hoặc admin | | Xóa xong có thể đánh giá lại |

`rating`: số nguyên 1–5. `comment`: ≤ 2000 ký tự.

---

## 11. Quản trị phân quyền (admin)

Thường chỉ dùng cho trang quản trị. Permission do lệnh `npm run sync-permissions` tự sinh từ code.

| Method | Path | Body | Ghi chú |
|---|---|---|---|
| GET | `/permissions` | `?page&limit` | `{ id, name, description, path, method }` |
| GET / PUT / DELETE | `/permissions/:permissionId` | PUT: `{ name, path, method, description? }` | |
| POST | `/permissions` | `{ name, path, method, description? }` | |
| GET | `/roles` | `?page&limit` | |
| GET | `/roles/:roleId` | | Kèm `permissions` |
| POST | `/roles` | `{ name, description?, isActive?, permissionIds? }` | Tên được đổi sang IN HOA |
| PUT | `/roles/:roleId` | `{ name, description?, isActive?, permissionIds }` | `permissionIds` **bắt buộc**, **thay toàn bộ** danh sách quyền |
| DELETE | `/roles/:roleId` | | 409 nếu còn user thuộc role |

Không sửa được ADMIN; không đổi tên, tắt hay xóa được INSTRUCTOR / STUDENT (403).

---

## 12. Gợi ý trang frontend ↔ API

| Trang | API |
|---|---|
| Trang chủ / tìm kiếm | `GET /categories`, `GET /courses?search&categoryId&level&price&sort&page` |
| Chi tiết khóa học | `GET /courses/:id` (kèm token nếu có), `GET /reviews?courseId`, nút ghi danh → `POST /enrollments` |
| Đăng nhập / đăng ký | `POST /auth/login`, `POST /auth/register`, sau đó `GET /auth/me` để biết role |
| Khóa học của tôi (học viên) | `GET /enrollments/mine` |
| Trang học | `GET /enrollments/mine/:courseId`, `GET /lectures/:id`, `POST/DELETE /lectures/:id/complete` |
| Viết đánh giá | `GET /reviews/mine/:courseId`, `POST` / `PUT /reviews` |
| Dashboard giảng viên | `GET /courses/mine`, tạo/sửa khóa, `GET /courses/mine/:id` + `/sections` + `/lectures`, `POST /courses/:id/submit` |
| Trang admin | `GET /courses/pending`, `GET /courses/admin/:id`, approve/reject, `/categories`, `/roles`, `/permissions` |

## 13. Tài khoản demo

Chạy `npm run seed` rồi `npm run seed:demo` trong thư mục `backend/`. Mật khẩu chung: **`Demo@1234`**

| Email | Role | Có sẵn |
|---|---|---|
| `giangvien1@edu.local` | INSTRUCTOR | 4 khóa: 2 đã xuất bản, 1 chờ duyệt, 1 bản nháp |
| `giangvien2@edu.local` | INSTRUCTOR | 2 khóa đã xuất bản |
| `hocvien1@edu.local` | STUDENT | Đã ghi danh 2 khóa miễn phí, học được khoảng 50%, đã đánh giá |
| `hocvien2@edu.local` | STUDENT | Đã ghi danh 2 khóa miễn phí, đã đánh giá |
| Admin | ADMIN | `ADMIN_EMAIL` / `ADMIN_PASSWORD` trong `backend/.env` |

## 14. Chưa có (làm sau)

Thanh toán (khóa có phí trả 402), upload video/ảnh (đang dùng URL), xác thực email / OTP / quên mật khẩu, sửa hồ sơ và đổi mật khẩu, quản lý user cho admin, hỏi đáp theo bài giảng, thông báo.
