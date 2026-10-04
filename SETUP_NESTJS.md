# Edu Platform – Backend

Backend cho một nền tảng học trực tuyến kiểu Udemy, với 3 vai trò:

- **Học viên (Student)**: mua và học các khóa học.
- **Giảng viên (Instructor)**: tạo và bán khóa học.
- **Admin**: quản lý toàn bộ hệ thống.

Tài liệu này gồm hai phần:

1. **Chạy nhanh**: dành cho người vừa clone repo và chỉ muốn chạy được backend.
2. **Nhật ký dựng project**: ghi lại từng bước đã làm và lý do chọn cách làm đó, để người đọc hiểu project được dựng lên như thế nào.

---

## Công nghệ sử dụng

| Thành phần | Công nghệ | Ghi chú |
|---|---|---|
| Framework | NestJS 12 + TypeScript | module CommonJS (CJS) |
| ORM | Prisma 7.10 | dùng driver adapter `@prisma/adapter-pg` |
| Database | PostgreSQL 17 | chạy bằng Docker |
| Validate dữ liệu | Zod 4 | kiểm tra biến môi trường (sau này dùng cho cả request body) |
| Cấu hình | `@nestjs/config` | đọc `.env`, cung cấp `ConfigService` |

---

## Phần 1: Chạy nhanh

### Yêu cầu

- Node.js 22 trở lên (project đang dùng Node 24)
- Docker Desktop (đã bật, trạng thái "Engine running")

### Các bước

```bash
# 1. Vào thư mục backend
cd backend

# 2. Tạo file môi trường từ file mẫu, rồi mở .env để đổi mật khẩu nếu muốn
cp .env.example .env

# 3. Cài package
npm install

# 4. Chạy Postgres bằng Docker
docker compose up -d

# 5. Tạo bảng trong database và sinh Prisma Client
npx prisma migrate dev
npx prisma generate

# 6. Chạy server ở chế độ dev (tự reload khi sửa code)
npm run start:dev
```

### Kiểm tra

Mở http://localhost:3000/health, kết quả mong đợi:

```json
{ "status": "ok", "database": "up" }
```

Nếu nhận được `503` và `"database": "down"` nghĩa là server không kết nối được Postgres. Xem mục [Lỗi thường gặp](#lỗi-thường-gặp).

### Các lệnh thường dùng (chạy trong `backend/`)

| Lệnh | Tác dụng |
|---|---|
| `npm run start:dev` | chạy server, tự reload khi sửa code |
| `npm run format` | format code bằng Prettier |
| `docker compose up -d` / `stop` / `start` | bật / tắt / bật lại Postgres |
| `npx prisma migrate dev --name <ten>` | tạo migration mới sau khi sửa `schema.prisma` |
| `npx prisma generate` | sinh lại Prisma Client (**bắt buộc** sau mỗi lần sửa schema) |
| `npx prisma studio` | mở giao diện web để xem và sửa dữ liệu |

---

## Cấu trúc thư mục

```
Edu_Platform/
├── .gitignore
├── SETUP_NESTJS.md              ← tài liệu này
└── backend/
    ├── .env.example             ← mẫu biến môi trường (file .env thật KHÔNG commit)
    ├── docker-compose.yml       ← khai báo container Postgres
    ├── prisma7.config.ts        ← cấu hình Prisma CLI (đường dẫn schema, DATABASE_URL)
    ├── prisma/
    │   ├── schema.prisma        ← định nghĩa các bảng (model)
    │   └── migrations/          ← lịch sử thay đổi cấu trúc DB (CÓ commit)
    └── src/
        ├── main.ts              ← điểm khởi động app
        ├── app.module.ts        ← module gốc, ghép các module lại với nhau
        ├── app.controller.ts    ← route GET / và GET /health
        ├── app.service.ts       ← logic của health check
        ├── config/
        │   └── env.schema.ts    ← schema Zod kiểm tra biến môi trường
        ├── prisma/
        │   ├── prisma.module.ts ← module @Global cung cấp PrismaService
        │   └── prisma.service.ts← kết nối DB, dùng chung toàn app
        └── generated/prisma/    ← code do `prisma generate` sinh ra (KHÔNG commit)
```

---

## Biến môi trường

Khai báo trong `backend/.env` (xem mẫu ở `backend/.env.example`).

| Biến | Dùng bởi | Ý nghĩa |
|---|---|---|
| `NODE_ENV` | NestJS | `development` / `production` / `test`, mặc định là `development` |
| `PORT` | NestJS | port của API, mặc định là `3000` |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Docker | tài khoản và tên database được tạo khi container chạy lần đầu |
| `POSTGRES_PORT` | Docker | port trên máy thật, map vào port 5432 của container |
| `DATABASE_URL` | NestJS, Prisma CLI | chuỗi kết nối, phải khớp với các biến `POSTGRES_*` |

Khi thêm một biến mới, cần làm đủ 3 việc:

1. Thêm vào `.env`.
2. Thêm vào `.env.example`.
3. Thêm vào `envSchema` trong `src/config/env.schema.ts`.

---

## Các khái niệm NestJS cần nắm

| NestJS | Vai trò | Gần giống trong Next.js |
|---|---|---|
| **Controller** | nhận request, định nghĩa route (`@Get()`, `@Post()`) | file `route.ts` trong `app/api/...` |
| **Service** (Provider) | chứa logic nghiệp vụ, gọi database | các hàm trong `lib/` |
| **Module** | gom controller và service của một tính năng thành một khối | không có khái niệm tương đương |

**Dependency Injection (DI):** không tự `new UserService()`. Chỉ cần khai báo service cần dùng trong `constructor`, Nest sẽ tự tạo instance (mỗi service một bản duy nhất, gọi là singleton) rồi truyền vào:

```ts
constructor(private readonly prisma: PrismaService) {}
```

**Quy tắc để DI hoạt động:** service phải nằm trong `providers` của một module. Nếu module khác muốn dùng service đó thì service phải có trong `exports`, và module kia phải `import` module chứa nó. Ngoại lệ là module được đánh dấu `@Global()` hoặc `isGlobal: true`: các module này dùng được ở mọi nơi mà không cần import.

Nếu quên một trong các điều trên, khi khởi động Nest sẽ báo lỗi kiểu:
`Nest could not find XxxService element` hoặc `Nest can't resolve dependencies of ...`.

---

## Phần 2: Nhật ký dựng project

### Bước 1: Khởi tạo NestJS

```bash
npx @nestjs/cli new backend --package-manager npm --skip-git
```

- Đặt project trong `backend/` để sau này có thể thêm `frontend/` (Next.js) bên cạnh.
- `--skip-git`: thư mục gốc `Edu_Platform` đã có git rồi, không cần tạo thêm repo git bên trong.
- Chọn **CJS** thay vì ESM: tài liệu và thư viện của NestJS chủ yếu viết theo CJS, khi import không cần ghi đuôi `.js`, và Jest chạy được ngay mà không phải cấu hình thêm.

**Đã gỡ `@nestjs/observe`.** Template của Nest CLI 12 cài sẵn dịch vụ telemetry trả phí này với key giả, nên khi chạy sẽ báo lỗi `Telemetry rejected (401)`. Cách gỡ: xoá `ObserveModule` khỏi `app.module.ts`, xoá `instrument: ObserveInstrument` trong `main.ts`, rồi chạy `npm uninstall @nestjs/observe`.

Thêm route `GET /health`. Khi controller `return` một object, Nest tự chuyển object đó thành JSON và gắn header `Content-Type: application/json`.

### Bước 2a: Postgres bằng Docker

File `docker-compose.yml` chạy image `postgres:17-alpine`, đọc các biến `POSTGRES_*` từ `.env` (Docker Compose tự đọc file `.env` nằm cùng thư mục).

- **Image**: bản cài đặt Postgres đóng gói sẵn, không cần cài Postgres vào Windows.
- **Container**: một image đang chạy, có thể xoá và tạo lại bất cứ lúc nào.
- **Volume `postgres_data`**: nơi lưu dữ liệu, nên xoá container thì dữ liệu vẫn còn.
- **Port `"${POSTGRES_PORT}:5432"`**: bên trái là port trên máy thật, bên phải là port trong container.

Kiểm tra database bên trong container:

```bash
docker compose ps
docker exec -it edu_postgres psql -U edu -d edu_platform -c "select version();"
```

> ⚠️ Lệnh `docker exec` kết nối từ **bên trong** container, nên kể cả khi port **chưa** được map ra máy thật thì lệnh vẫn chạy. Muốn chắc chắn port đã ra ngoài, xem `docker ps` có dòng `0.0.0.0:5432->5432/tcp`.

### Bước 2b: Prisma và model `User`

```bash
npm i -D prisma@7.10.0
npm i @prisma/client@7.10.0 @prisma/adapter-pg@7.10.0 dotenv
npx prisma init --datasource-provider postgresql --output ../src/generated/prisma --no-skills
```

- Ghi rõ bản `7.10.0` vì tag `latest` trên npm đang trỏ tới bản `8.0.0-rc`, chưa ổn định.
- `--no-skills`: không tạo các thư mục `.claude/`, `.agents/` không cần thiết.
- File cấu hình do lệnh trên tạo ra có tên là **`prisma7.config.ts`** (không phải `prisma.config.ts`). File này đã có `import "dotenv/config"` vì Prisma 7 không tự đọc `.env`.

Schema (`prisma/schema.prisma`):

```prisma
generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "cjs"            // sinh code CJS cho khớp với NestJS
}

datasource db {
  provider = "postgresql"
}

enum Role {
  STUDENT
  INSTRUCTOR
  ADMIN
}

model User {
  id           String   @id @default(uuid())  // id dạng uuid, người ngoài không đoán được
  email        String   @unique
  passwordHash String                          // chỉ lưu mật khẩu đã hash, không lưu mật khẩu gốc
  fullName     String
  avatarUrl    String?                         // dấu ? nghĩa là được phép null
  role         Role     @default(STUDENT)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt             // Prisma tự cập nhật mỗi khi bản ghi thay đổi
}
```

```bash
npx prisma migrate dev --name init_user   # tạo bảng và lưu migration vào prisma/migrations/
npx prisma generate                       # sinh Prisma Client vào src/generated/prisma
```

- **Migration** giống git nhưng dành cho cấu trúc database. Thư mục `prisma/migrations/` **phải commit** để người khác tạo được cấu trúc database giống hệt.
- Từ Prisma 7, `migrate dev` **không còn tự chạy** `generate`, nên phải chạy `generate` riêng.
- `src/generated/` là code sinh tự động nên không commit. Ai clone repo về thì tự chạy `npx prisma generate`.

### Bước 2c: `PrismaService` – đưa Prisma vào NestJS

```bash
npx nest g module prisma
npx nest g service prisma --no-spec
```

- `PrismaService` kế thừa (`extends`) `PrismaClient`, nên ở chỗ khác có thể gọi trực tiếp `this.prisma.user.findMany()`.
- `onModuleInit` / `onModuleDestroy` là lifecycle hook: Nest gọi chúng khi app khởi động và khi app tắt, để mở và đóng kết nối DB.
- `PrismaModule` có `@Global()` và `exports: [PrismaService]`, nên mọi module dùng được mà không cần import lại.
- Cả app dùng **một** kết nối DB duy nhất, không phải mỗi service tự `new PrismaClient()`.

Route `GET /health` gọi `` this.prisma.$queryRaw`SELECT 1` `` để thử kết nối:

- Kết nối được thì trả về `{ "status": "ok", "database": "up" }`.
- Lỗi thì `throw new ServiceUnavailableException(...)`, Nest tự trả về HTTP **503**.

NestJS có sẵn các exception: `BadRequestException` (400), `UnauthorizedException` (401), `ForbiddenException` (403), `NotFoundException` (404)…

### Bước 3: Kiểm tra biến môi trường bằng Zod

```bash
npm i @nestjs/config zod
```

- `src/config/env.schema.ts` khai báo `envSchema` (Zod) và hàm `validateEnv`.
- `app.module.ts` đăng ký `ConfigModule.forRoot({ isGlobal: true, validate: validateEnv })`.

Thứ tự khi app khởi động:

```
ConfigModule đọc .env
   → gọi validateEnv(process.env)
       ❌ sai hoặc thiếu biến → throw → app DỪNG và in ra biến bị lỗi
       ✅ hợp lệ → lưu vào ConfigService
   → PrismaService, main.ts lấy giá trị bằng config.get('...', { infer: true })
```

- `z.coerce.number()`: giá trị trong `.env` luôn là chuỗi, `coerce` ép sang kiểu số.
- `z.infer<typeof envSchema>` sinh ra type `Env`. Nhờ đó `ConfigService<Env, true>` biết chính xác kiểu của từng biến, và gõ sai tên biến thì TypeScript báo lỗi ngay.
- Zod chỉ kiểm tra **định dạng**. Ví dụ `DATABASE_URL` sai mật khẩu vẫn vượt qua bước kiểm tra, lỗi chỉ lộ ra khi kết nối DB (`/health` sẽ báo `down`).
- `main.ts` không có constructor nên lấy service bằng `app.get(ConfigService)`.

---

## Lỗi thường gặp

| Triệu chứng | Nguyên nhân / cách sửa |
|---|---|
| `Telemetry rejected (401)` khi chạy | template cài sẵn `@nestjs/observe`, gỡ đi (xem Bước 1) |
| `port is already allocated` khi `docker compose up` | một Postgres khác (cài trên máy, hoặc container của project khác) đang dùng port 5432. Đổi `POSTGRES_PORT` **và** port trong `DATABASE_URL` sang 5433 |
| `/health` trả về `"database": "down"` | Docker chưa chạy (`docker compose ps`), hoặc `DATABASE_URL` không khớp với `POSTGRES_*` |
| `Nest could not find ConfigService element` | chưa thêm `ConfigModule.forRoot(...)` vào `imports` của `AppModule` |
| `File .env không hợp lệ: ✖ ... → at DATABASE_URL` | thiếu biến hoặc giá trị sai định dạng trong `.env` |
| `Cannot find module '../generated/prisma/client'` | chưa chạy `npx prisma generate` |

---

## Lộ trình tiếp theo

- [x] Bước 1: Khởi tạo NestJS, route `/health`
- [x] Bước 2: Postgres (Docker), Prisma, `PrismaService`
- [x] Bước 3: Kiểm tra biến môi trường bằng Zod
- [ ] Bước 4: Đăng ký, đăng nhập (bcrypt, JWT access/refresh token)
- [ ] Bước 5: Phân quyền theo role (Student / Instructor / Admin)
- [ ] Bước 6: Khóa học (giảng viên tạo và xuất bản, học viên xem)
- [ ] Bước 7: Section và Lecture
- [ ] Bước 8: Mua hoặc ghi danh khóa học, theo dõi tiến độ
- [ ] Bước 9: Đánh giá, upload, trang quản trị cho admin…
