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
| 413 | File upload quá lớn | Báo người dùng chọn file nhỏ hơn |
| 429 | Gọi quá nhiều lần (xem bên dưới) | Hiện `message`, đợi `Retry-After` giây |
| 503 | Hệ thống email tạm lỗi (quên mật khẩu) | "Thử lại sau" |
| 422 | Dữ liệu gửi lên sai | Hiện lỗi theo `errors[].field` |
| 500 | Lỗi server | Thông báo chung "thử lại sau" |

**Giới hạn số request (429):** đăng nhập sai quá **10 lần / 15 phút**, đăng ký quá **10 lần / giờ**, xin mã OTP quá **5 lần / 15 phút**, nhập mã quá **10 lần / 15 phút** (theo IP) thì nhận **429** kèm header `Retry-After` (số giây phải đợi). Toàn bộ API giới hạn 1000 request / 15 phút. Hiện `message` cho người dùng là đủ.

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
POST /auth/login (hoặc /auth/register) ──> { accessToken (15 phút), refreshToken (7 ngày) }
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
| POST | `/auth/register` | `{ email, password, confirmPassword, name, phoneNumber }` | Tạo tài khoản **STUDENT** và đăng nhập luôn: 201 trả `data` giống hệt login. 409 nếu email đã dùng |
| POST | `/auth/login` | `{ email, password }` | `data: { accessToken, refreshToken, account: { id, name, email, role } }`, `role` là chuỗi `ADMIN` / `INSTRUCTOR` / `STUDENT`. 401 sai email/mật khẩu, 403 tài khoản bị khóa |
| GET | `/auth/me` | | 🔒 Thông tin user + `role: { id, name }` → dùng để biết là ADMIN / INSTRUCTOR / STUDENT |
| POST | `/auth/refresh-token` | `{ refreshToken }` | `data: { accessToken, refreshToken }` (cặp mới) |
| POST | `/auth/logout` | `{ refreshToken }` | Không cần access token (vẫn đăng xuất được khi access token đã hết hạn) |

Ràng buộc đăng ký: `password` 8–100 ký tự, `confirmPassword` phải trùng, `phoneNumber` 9–15 ký tự, `name` 1–100 ký tự. Đăng ký xong có email chào mừng.

### Quên mật khẩu (OTP qua email)

| Method | Path | Body | Ghi chú |
|---|---|---|---|
| POST | `/auth/forgot-password` | `{ email }` | Gửi mã OTP 6 số, hiệu lực **10 phút**. **Luôn trả 200 cùng một câu**, dù email có tồn tại hay không (không cho dò email). Gửi lại trong vòng 60 giây sẽ không có email mới. 503 nếu hệ thống email đang lỗi |
| POST | `/auth/reset-password` | `{ email, code, newPassword, confirmPassword }` | `code` là 6 chữ số. Sai / hết hạn / đã dùng → 422 (`field: code`). Sai **5 lần** thì mã bị hủy, phải xin mã mới. Thành công: mọi thiết bị bị đăng xuất, cần đăng nhập lại |

Luồng frontend: trang "Quên mật khẩu" (nhập email) → trang "Nhập mã" (OTP + mật khẩu mới) → về trang đăng nhập.

Lúc dev, email **không gửi ra ngoài thật** mà vào Mailpit: mở `http://localhost:8025` để xem mã OTP.

### Hồ sơ của tôi

🔒 Mọi role đều dùng được (chỉ cần đăng nhập).

| Method | Path | Body | Ghi chú |
|---|---|---|---|
| GET | `/profile` | | Giống `GET /auth/me` |
| PUT | `/profile` | `{ name, phoneNumber, avatar? }` | `avatar`: URL ảnh; gửi `null` để xóa; không gửi thì giữ nguyên. Trả về hồ sơ mới |
| PUT | `/profile/password` | `{ currentPassword, newPassword, confirmPassword }` | Sai mật khẩu hiện tại → 422 (`field: currentPassword`). Thành công: **mọi thiết bị khác bị đăng xuất**, `data: { accessToken, refreshToken }` là cặp token MỚI cho thiết bị đang dùng → frontend phải lưu đè |

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

## 3b. Upload ảnh / video

Upload trước, nhận `url`, rồi gửi `url` đó vào API khác: `avatar` (`PUT /profile`), `thumbnail` (`POST/PUT /courses`), `videoUrl` (`POST/PUT /lectures`).

| Method | Path | Ai | Giới hạn |
|---|---|---|---|
| POST | `/uploads/image` | 🔒 mọi người đã đăng nhập | jpg, png, webp, gif, tối đa **5 MB** |
| POST | `/uploads/video` | 🔑 giảng viên / admin | mp4, webm, mov, tối đa **500 MB** |

Gửi dạng **`multipart/form-data`**, đúng **1 file**, field tên **`file`**:
```ts
const form = new FormData()
form.append('file', fileInput.files[0])
await fetch(`${API}/uploads/image`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
// Không tự đặt Content-Type: trình duyệt tự thêm kèm boundary
```

Response 201:
```json
{ "message": "Tải file lên thành công", "data": { "url": "http://localhost:4000/uploads/images/<uuid>.png", "mimeType": "image/png", "size": 52341, "originalName": "anh.png" } }
```

Lỗi: sai loại file, hoặc nội dung file không khớp loại khai báo (ví dụ đổi đuôi `.txt` thành `.jpg`) → **422**; file quá lớn → **413**; không gửi file / gửi 2 file → **422**.

File được phục vụ lại tại `url` (GET, công khai). Video hỗ trợ tua (HTTP Range), dùng thẳng trong thẻ `<video src="...">`.

**Khi có `CLOUDINARY_URL`** (bản deploy): file được đẩy lên Cloudinary, `url` có dạng `https://res.cloudinary.com/<cloud>/image/upload/...`. Video có thêm **`durationSec`** (giây, Cloudinary tự đọc) để gửi tiếp khi tạo / sửa bài giảng. Lỗi khi đẩy lên Cloudinary → **502**. Gói miễn phí của Cloudinary giới hạn dung lượng mỗi file (ảnh khoảng 10 MB, video khoảng 100 MB), nên khi deploy đặt `MAX_VIDEO_MB` không vượt mức này.

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
| PUT | `/courses/:courseId` | xem bên dưới | Khi `DRAFT` / `REJECTED` / `PUBLISHED`. Đang `PENDING` → **409** |
| DELETE | `/courses/:courseId` | | Chỉ khi `DRAFT` / `REJECTED` (đã xuất bản thì không xóa được, **409**) |
| POST | `/courses/:courseId/submit` | | Gửi duyệt: `DRAFT`/`REJECTED` → `PENDING`. Cần ít nhất 1 bài giảng (**409**) |
| GET | `/courses/mine/:courseId/students` | `?page&limit` | Học viên của khóa + tiến độ từng người (xem bên dưới) |
| GET | `/stats/instructor` | | Số liệu dashboard (mục 11) |

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

Khi khóa bị từ chối (hoặc bị admin gỡ), `GET /courses/mine/:courseId` có `rejectReason` để hiển thị cho giảng viên sửa.

**Sửa khóa đã xuất bản** (`PUBLISHED`): thông tin khóa, chương, bài giảng đều sửa được và **có hiệu lực ngay** (không duyệt lại), để giảng viên sửa lỗi hoặc thêm bài cho học viên đang học. Riêng khóa đã xuất bản **phải còn ít nhất 1 bài giảng**: xóa bài / chương cuối cùng → **409**.

`GET /courses/mine/:courseId/students`, mỗi phần tử:
```json
{
  "enrolledAt": "2026-10-10T08:00:00.000Z",
  "user": { "id": 7, "name": "...", "email": "...", "avatar": null },
  "progress": { "totalLectures": 8, "completedLectures": 4, "percent": 50 }
}
```

---

## 7. Chương & bài giảng (giảng viên soạn bài)

Sửa được khi khóa là của mình và đang `DRAFT` / `REJECTED` / `PUBLISHED` (không phải `PENDING`). Mục mới luôn được thêm vào **cuối**.

| Method | Path | Body |
|---|---|---|
| POST | `/sections` | `{ courseId, title }` |
| PUT | `/sections/reorder` | `{ courseId, sectionIds: [5, 3, 4] }`: **đủ tất cả** id chương theo thứ tự mới (thiếu / thừa / trùng → 422). Trả về danh sách chương đã sắp |
| PUT | `/sections/:sectionId` | `{ title, position? }` |
| DELETE | `/sections/:sectionId` | Xóa luôn các bài giảng trong chương |
| POST | `/lectures` | `{ sectionId, title, videoUrl?, content?, durationSec?, isPreview? }` |
| PUT | `/lectures/reorder` | `{ sectionId, lectureIds: [...] }`: giống trên, cho các bài trong 1 chương |
| PUT | `/lectures/:lectureId` | `{ title, videoUrl?, content?, durationSec?, isPreview?, sectionId?, position? }` |
| DELETE | `/lectures/:lectureId` | |

- `videoUrl`: URL video (lấy từ `POST /uploads/video`, hoặc link có sẵn). `durationSec`: 0–86400. `isPreview: true` = ai cũng xem được.
- **Kéo thả đổi thứ tự**: gọi `PUT /sections/reorder` hoặc `PUT /lectures/reorder` một lần với cả danh sách, thay vì sửa `position` từng mục.
- **Chuyển bài sang chương khác**: `PUT /lectures/:id` kèm `sectionId` mới (phải cùng khóa, ngược lại 422). Không gửi `position` thì bài nằm cuối chương mới.

---

## 8. Duyệt khóa học (admin)

| Method | Path | Body | Ghi chú |
|---|---|---|---|
| GET | `/courses/pending` | `?page&limit` | Khóa chờ duyệt, gửi trước lên trước, kèm `instructor: { id, name, email }` |
| GET | `/courses/admin/:courseId` | | Chi tiết khóa ở **mọi** trạng thái + mục lục + giảng viên |
| POST | `/courses/:courseId/approve` | | `PENDING` → `PUBLISHED` |
| POST | `/courses/:courseId/reject` | `{ reason }` | `PENDING` → `REJECTED`, lưu lý do |
| GET | `/courses/admin` | `?search&status&instructorId&categoryId&page&limit` | **Tất cả** khóa học (mọi trạng thái, mọi giảng viên), mới sửa nhất trước. Mỗi item kèm `instructor`, `category`, `studentCount` |
| POST | `/courses/:courseId/unpublish` | `{ reason }` | **Gỡ** khóa đang công khai: `PUBLISHED` → `REJECTED` kèm lý do. Khóa biến mất khỏi trang công khai, **học viên đã ghi danh tạm không vào học được** cho đến khi giảng viên sửa và được duyệt lại |

Approve/reject khi khóa không ở `PENDING`, unpublish khi không ở `PUBLISHED` → **409**.

Duyệt, từ chối, gỡ khóa đều **gửi email cho giảng viên** (kèm lý do nếu có).

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

## 11. Quản trị (admin) và thống kê

### Người dùng

🔑 Admin.

| Method | Path | Body / Query | Ghi chú |
|---|---|---|---|
| GET | `/users` | `?search&roleId&status&page&limit` | `search` tìm theo tên hoặc email. Mỗi item `{ id, email, name, phoneNumber, avatar, status, createdAt, role: { id, name } }` |
| GET | `/users/:userId` | | Như trên + `stats: { teachingCourses, enrolledCourses, reviews }` |
| PUT | `/users/:userId/status` | `{ status: "ACTIVE" \| "BLOCKED" }` | Khóa → đăng xuất mọi thiết bị, mọi request sau đó của user bị **403** ngay |
| PUT | `/users/:userId/role` | `{ roleId }` | Ví dụ nâng học viên lên giảng viên. Có hiệu lực ngay |

Không đổi được trạng thái / role của **chính mình** (403).

### Thống kê (dashboard)

`GET /stats/admin` (🔑 Admin):
```json
{
  "users": { "total": 15, "blocked": 1, "newLast30Days": 6, "byRole": { "ADMIN": 1, "INSTRUCTOR": 4, "STUDENT": 10 } },
  "courses": { "total": 8, "byStatus": { "DRAFT": 2, "PENDING": 1, "PUBLISHED": 4, "REJECTED": 1 } },
  "enrollments": { "total": 5, "newLast30Days": 5 },
  "reviews": { "total": 4, "averageRating": 4.8 }
}
```

`GET /stats/instructor` (🔑 Giảng viên, số liệu các khóa **của mình**):
```json
{
  "courses": { "total": 4, "byStatus": { "DRAFT": 1, "PENDING": 1, "PUBLISHED": 2, "REJECTED": 0 } },
  "totalStudents": 12,
  "reviews": { "total": 5, "averageRating": 4.6 },
  "topCourses": [ { "id": 1, "title": "...", "status": "PUBLISHED", "studentCount": 8, "reviewCount": 3 } ]
}
```

### Phân quyền

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
| Tài khoản của tôi | `GET` / `PUT /profile`, `PUT /profile/password` |
| Dashboard giảng viên | `GET /stats/instructor`, `GET /courses/mine`, tạo/sửa khóa, `GET /courses/mine/:id` + `/sections` + `/lectures` (+ `/reorder`), `POST /courses/:id/submit`, `GET /courses/mine/:id/students` |
| Trang admin | `GET /stats/admin`, `GET /courses/admin`, `GET /courses/pending`, `GET /courses/admin/:id`, approve/reject/unpublish, `/users`, `/categories`, `/roles`, `/permissions` |

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

Thanh toán (khóa có phí trả 402), xác thực email khi đăng ký, hỏi đáp theo bài giảng, thông báo. Upload hiện lưu trên ổ đĩa server (chưa dùng cloud như S3 / Cloudinary).
