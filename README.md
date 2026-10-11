# Edu Platform

Nền tảng học trực tuyến kiểu Udemy, với 3 vai trò:

- **Học viên (Student)**: tìm khóa học, ghi danh, học và đánh giá.
- **Giảng viên (Instructor)**: tạo khóa học, soạn chương và bài giảng, gửi duyệt.
- **Admin**: duyệt khóa học, quản lý danh mục, role và quyền.

Thư mục:

```
Edu_Platform/
├── backend/      API (Express + Prisma + PostgreSQL)
└── docs/API.md   Tài liệu API cho frontend
```

---

## Công nghệ

| Thành phần | Công nghệ | Ghi chú |
|---|---|---|
| Framework | Express 5 + TypeScript | Express 5 tự bắt lỗi của hàm `async` |
| ORM | Prisma 7 | driver adapter `@prisma/adapter-pg`, client sinh vào `src/generated/prisma` |
| Database | PostgreSQL 17 | chạy bằng Docker |
| Validate | Zod 4 | kiểm tra `.env`, body, params, query |
| Xác thực | JWT (`jsonwebtoken`) | access token 15 phút + refresh token 7 ngày, xoay vòng |
| Mật khẩu | bcrypt | cost 10 |
| Lint | oxlint | |

---

## Chạy nhanh

Yêu cầu: Node.js 22 trở lên, Docker Desktop đang chạy.

```bash
cd backend

# 1. File môi trường (mở .env để đổi secret, mật khẩu admin)
cp .env.example .env

# 2. Cài package
npm install

# 3. Postgres
docker compose up -d

# 4. Tạo bảng + sinh Prisma Client
npx prisma migrate dev
npx prisma generate

# 5. Dữ liệu ban đầu
npm run seed               # 3 role + tài khoản admin (lấy từ .env)
npm run sync-permissions   # sinh permission từ route + gán quyền mặc định cho từng role
npm run seed:demo          # (tùy chọn) giảng viên, học viên, khóa học mẫu, mật khẩu Demo@1234

# 6. Chạy server (tự reload khi sửa code)
npm run dev                # http://localhost:4000
```

Kiểm tra: mở `http://localhost:4000/courses`, sẽ thấy danh sách khóa học (rỗng nếu chưa chạy `seed:demo`).

### Các lệnh (chạy trong `backend/`)

| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy server dev, tự reload |
| `npm run typecheck` | Kiểm tra kiểu TypeScript |
| `npm run lint` | oxlint (`--type-aware`). Nếu `tsgolint.exe` không chạy được thì dùng `npx oxlint src/` |
| `npm run format` | Prettier |
| `npm run seed` | Tạo role + admin (chỉ chạy được khi DB chưa có role) |
| `npm run seed:demo` | Dữ liệu mẫu (bỏ qua nếu đã có) |
| `npm run sync-permissions` | Đồng bộ bảng Permission với route. **Thêm `-- --dry` để xem trước** |
| `npx prisma migrate dev --name <tên>` | Sau khi sửa `schema.prisma` |
| `npx prisma studio` | Xem / sửa dữ liệu bằng giao diện web |

---

## Biến môi trường (`backend/.env`)

| Biến | Ý nghĩa |
|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | Cho Docker tạo Postgres |
| `DATABASE_URL` | Chuỗi kết nối Prisma, phải khớp với các biến `POSTGRES_*` |
| `PORT` | Cổng API, mặc định 4000 |
| `CORS_ORIGINS` | Frontend được phép gọi API, cách nhau bằng dấu phẩy. Mặc định `http://localhost:5173,http://localhost:3000` |
| `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET` | Khóa ký JWT, mỗi cái một chuỗi ngẫu nhiên khác nhau |
| `ACCESS_TOKEN_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN` | Ví dụ `15m`, `7d` |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_PHONE_NUMBER` | Tài khoản admin do `npm run seed` tạo |

`.env` sai hoặc thiếu biến thì server dừng ngay và in ra biến bị lỗi (kiểm tra bằng Zod trong `src/config/env.ts`).

---

## Cấu trúc backend

```
backend/
├── prisma/
│   ├── schema.prisma          Định nghĩa bảng
│   └── migrations/            Lịch sử thay đổi DB (commit cùng code)
└── src/
    ├── server.ts              Khởi động server
    ├── app.ts                 Gắn middleware + router; danh sách protectedRouters
    ├── config/env.ts          Đọc và kiểm tra .env
    ├── constants/
    │   ├── role.ts            Tên 3 role hệ thống
    │   └── default-permissions.ts   Quyền mặc định của INSTRUCTOR / STUDENT
    ├── lib/prisma.ts          Prisma Client dùng chung
    ├── middleware/
    │   ├── auth.middleware.ts       requireAuth, optionalAuth, requireRole, requirePermission
    │   ├── validate.middleware.ts   validateBody / validateParams / validateQuery (Zod)
    │   └── error.middleware.ts      404 + xử lý lỗi tập trung
    ├── utils/                 jwt, crypto (bcrypt), HttpError, pagination, permission-path
    ├── scripts/               seed, seed-demo, sync-permissions
    └── modules/               Mỗi chức năng một thư mục
        └── <module>/
            ├── <module>.schema.ts      Zod: dữ liệu hợp lệ
            ├── <module>.service.ts     Logic + Prisma
            ├── <module>.controller.ts  Đọc req, gọi service, trả res
            └── <module>.route.ts       Khai báo URL + middleware
```

Module: `auth`, `permission`, `role`, `category`, `course`, `section`, `lecture`, `enrollment`, `review`.

### Một request đi qua những đâu

```
express.json → router (theo prefix) → requireAuth → requirePermission → validate... → controller → service → Prisma
                                          │               │                  │
                                         401             403                422        lỗi nào cũng về errorHandler
```

---

## Các khái niệm chính

### Xác thực (JWT)

- **Access token**: 15 phút, không lưu DB. `requireAuth` chỉ kiểm tra chữ ký.
- **Refresh token**: 7 ngày, **lưu DB**, mỗi token dùng **một lần**. Mỗi lần refresh thì xóa token cũ và cấp cặp mới, trong cùng một transaction.
- Logout = xóa refresh token khỏi DB.

### Phân quyền động (RBAC)

```
User ──1 role──> Role ──nhiều──> Permission (method + path, ví dụ "PUT /courses/:courseId")
```

- Route nào cần quyền thì gắn `requireAuth, requirePermission` **ở từng route** (`req.route` chỉ có ở mức route).
- `npm run sync-permissions` đọc các route có `requirePermission` trong `protectedRouters` (`app.ts`), rồi tạo hoặc xóa mềm permission cho khớp, gán **tất cả** cho ADMIN và gán quyền trong `default-permissions.ts` cho INSTRUCTOR / STUDENT. Lệnh này chỉ **thêm** quyền, không gỡ quyền admin đã gán bằng tay.
- Mỗi request, `requirePermission` đọc DB nên đổi quyền hay khóa tài khoản có hiệu lực **ngay**.
- Quyền theo **chủ sở hữu** (giảng viên chỉ sửa khóa của mình...) kiểm tra trong service.

**Thêm một API mới cần phân quyền:**

1. Khai báo route kèm `requireAuth, requirePermission`.
2. Router mới thì thêm vào `protectedRouters` trong `app.ts`.
3. Nếu INSTRUCTOR / STUDENT cần quyền này, thêm `"METHOD /path"` vào `src/constants/default-permissions.ts`.
4. `npm run sync-permissions -- --dry` → kiểm tra "Sẽ xoá" **rỗng** → `npm run sync-permissions`.

### Vòng đời khóa học

```
DRAFT ──gửi duyệt──> PENDING ──admin duyệt──> PUBLISHED (hiện công khai, ghi danh được)
  ▲                     │
  └──── REJECTED <──────┘ admin từ chối (kèm lý do)
```

Chỉ sửa được khóa, chương, bài khi khóa đang `DRAFT` / `REJECTED`. Đổi trạng thái dùng `updateMany` kèm điều kiện trạng thái cũ, nên 2 admin bấm duyệt cùng lúc thì chỉ một người thành công.

### Quy ước dữ liệu

- **Xóa mềm** (`deletedAt`) cho user, role, permission, category, course, section, lecture: mọi query đọc đều lọc `deletedAt: null`. Riêng đánh giá thì xóa thật.
- Giá tiền là **VND số nguyên**. Thời lượng tính bằng **giây**.
- Response: `{ message, data }`. Danh sách: `{ message, data, totalItems, page, limit, totalPages }`. Lỗi: `{ message, errors? }`.

Chi tiết từng API: **[docs/API.md](docs/API.md)**.

---

## Lỗi thường gặp

| Triệu chứng | Nguyên nhân / cách sửa |
|---|---|
| `port is already allocated` khi `docker compose up` | Một Postgres khác đang dùng port 5432. Đổi `POSTGRES_PORT` **và** port trong `DATABASE_URL` sang 5433 |
| `Can't reach database server` | Docker Desktop chưa bật, hoặc `DATABASE_URL` không khớp `POSTGRES_*` |
| `Các giá trị khai báo trong file .env không hợp lệ` | Thiếu biến hoặc sai định dạng, xem dòng lỗi in ra |
| `Cannot find module '../generated/prisma/client'` | Chưa chạy `npx prisma generate` |
| `Property 'xxx' does not exist on type 'PrismaClient'` | Sửa `schema.prisma` mà chưa `migrate dev` / `generate` |
| API trả 500, log có `Unknown argument 'createById'` | Tên field sai so với cột (ví dụ thiếu chữ `d`: `createdById`). TypeScript không bắt được lỗi này với `data` của Prisma |
| Mọi request của giảng viên / học viên đều 403 | Chưa chạy `npm run sync-permissions` sau khi thêm route |
| `sync-permissions` báo "Sẽ xoá" nhiều permission đang dùng | **Dừng lại**: thường do một route bị gỡ `requirePermission` hoặc router bị bỏ khỏi `protectedRouters` |
| `npm run lint` lỗi `spawnSync ... tsgolint.exe UNKNOWN` | Lỗi công cụ trên Windows, dùng `npx oxlint src/` |
| Trình duyệt báo lỗi CORS | Thêm địa chỉ frontend vào `CORS_ORIGINS` trong `.env` rồi khởi động lại server |

---

## Tiến độ

- [x] Xác thực: đăng ký, đăng nhập, `me`, refresh token xoay vòng, logout
- [x] Phân quyền động: Permission, Role, sync từ route, quyền mặc định
- [x] Danh mục
- [x] Khóa học: giảng viên quản lý, luồng duyệt, trang công khai có tìm kiếm / lọc / sắp xếp
- [x] Chương và bài giảng, bài xem thử
- [x] Ghi danh (khóa miễn phí), tiến độ học
- [x] Đánh giá, điểm trung bình
- [x] CORS, dữ liệu demo, tài liệu API
- [ ] Thanh toán (khóa có phí đang trả 402)
- [ ] Upload video / ảnh (đang dùng URL)
- [ ] Email: xác thực tài khoản, OTP, quên mật khẩu
- [ ] Hồ sơ người dùng, đổi mật khẩu; admin quản lý user
- [ ] Hỏi đáp theo bài giảng, thông báo
- [ ] Test tự động, rate limit, cron dọn refresh token hết hạn
