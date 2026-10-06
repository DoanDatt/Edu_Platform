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
| Validate dữ liệu | Zod 4 | kiểm tra biến môi trường và request body |
| Cấu hình | `@nestjs/config` | đọc `.env`, cung cấp `ConfigService` |
| Hash mật khẩu | bcrypt 6 | cost 10, có salt ngẫu nhiên |
| Xác thực | `@nestjs/jwt` | JWT access token, ký bằng HS256 |

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

Mở http://localhost:4000/health, kết quả mong đợi:

```json
{ "status": "ok", "database": "up" }
```

Nếu nhận được `503` và `"database": "down"` nghĩa là server không kết nối được Postgres. Xem mục [Lỗi thường gặp](#lỗi-thường-gặp).

### Thử các API

Cài extension **REST Client** (tác giả Huachao Mao) trong VS Code, mở file `backend/request.http` rồi bấm **Send Request** phía trên mỗi request.

| Method | Route | Body | Kết quả |
|---|---|---|---|
| `GET` | `/health` | – | `200` nếu DB chạy, `503` nếu DB tắt |
| `POST` | `/auth/register` | `{ email, password, fullName }` | `201` + thông tin user (không có `passwordHash`) · `409` email đã dùng · `422` dữ liệu sai |
| `POST` | `/auth/login` | `{ email, password }` | `200` + `{ accessToken }` · `401` sai email hoặc mật khẩu · `422` dữ liệu sai |
| `GET` | `/auth/me` | – (header `Authorization: Bearer <accessToken>`) | `200` + thông tin user · `401` thiếu, sai hoặc hết hạn token |

Trong `request.http`, request đăng nhập có dòng `# @name login`. Các request sau dùng `{{login.response.body.accessToken}}` để tự lấy token, nên phải gửi request đăng nhập trước.

Lỗi `422` có dạng:

```json
{
  "message": "Dữ liệu không hợp lệ!",
  "errors": [{ "field": "email", "message": "Email không hợp lệ" }]
}
```

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
    ├── request.http             ← các request mẫu để test API bằng REST Client
    ├── prisma7.config.ts        ← cấu hình Prisma CLI (đường dẫn schema, DATABASE_URL)
    ├── prisma/
    │   ├── schema.prisma        ← định nghĩa các bảng (model)
    │   └── migrations/          ← lịch sử thay đổi cấu trúc DB (CÓ commit)
    └── src/
        ├── main.ts              ← điểm khởi động app
        ├── app.module.ts        ← module gốc, ghép các module lại với nhau
        ├── app.controller.ts    ← route GET / và GET /health
        ├── app.service.ts       ← logic của health check
        ├── auth/
        │   ├── auth.module.ts   ← import JwtModule (cấu hình bằng registerAsync)
        │   ├── auth.controller.ts← POST /auth/register, POST /auth/login
        │   ├── auth.service.ts  ← hash/compare mật khẩu, tạo user, ký JWT
        │   ├── auth.schema.ts   ← schema Zod cho body đăng ký / đăng nhập
        │   ├── auth.types.ts    ← kiểu JwtPayload, AuthenticatedRequest
        │   └── jwt-auth.guard.ts← Guard kiểm tra access token
        ├── common/
        │   └── pipes/
        │       └── zod-validation.pipe.ts ← pipe dùng chung: validate bằng Zod, lỗi trả 422
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
| `PORT` | NestJS | port của API, mặc định là `4000` (port `3000` để dành cho frontend Next.js) |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Docker | tài khoản và tên database được tạo khi container chạy lần đầu |
| `POSTGRES_PORT` | Docker | port trên máy thật, map vào port 5432 của container |
| `DATABASE_URL` | NestJS, Prisma CLI | chuỗi kết nối, phải khớp với các biến `POSTGRES_*` |
| `JWT_ACCESS_SECRET` | NestJS | khoá bí mật để ký access token, tối thiểu 32 ký tự. Tạo bằng `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_ACCESS_EXPIRES_IN` | NestJS | thời hạn access token, **tính bằng giây** (ví dụ `900` = 15 phút) |

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

**Hai loại "import" khác nhau:**

| | `import` ở đầu file | `imports: []` trong `@Module` |
|---|---|---|
| Thuộc về | TypeScript | NestJS |
| Tác dụng | đưa code (class, hàm, type) từ file khác vào | cho module này dùng các service mà module kia `exports` |

**Pipe và vòng đời của request:**

```
Request → Middleware → Guard → Interceptor → Pipe → Controller
                        │                     └─ validate hoặc biến đổi body/params/query
                        └─ kiểm tra quyền truy cập
```

Pipe chạy ngay trước controller. Nếu pipe `throw`, controller không chạy. Giá trị pipe `return` sẽ **thay thế** dữ liệu gốc, nên controller nhận dữ liệu đã được làm sạch.

| | Guard | Pipe |
|---|---|---|
| Trả lời câu hỏi | "Người gửi **là ai**, có được vào không?" (*authentication / authorization*) | "Dữ liệu gửi lên có **đúng định dạng** không?" (*validation*) |
| Lỗi thường trả về | `401` / `403` | `422` |
| Trong project | `JwtAuthGuard` | `ZodValidationPipe` |
| Tương đương trong Express | middleware kiểm tra token, gọi `next()` khi hợp lệ | middleware validate `req.body` |

Guard chạy **trước** Pipe: chưa biết người gửi là ai thì chưa cần kiểm tra dữ liệu họ gửi.

**Dynamic module (`register` / `registerAsync`):** một số module cần cấu hình trước khi dùng, ví dụ `ConfigModule.forRoot(...)`, `JwtModule.registerAsync(...)`. Khi cấu hình phải lấy từ một service khác (thường là `ConfigService`), dùng bản `Async`:

```ts
JwtModule.registerAsync({
  inject: [ConfigService],                 // Nest truyền các service này vào useFactory, theo thứ tự
  useFactory: (config: ConfigService<Env, true>) => ({   // hàm trả về object cấu hình
    secret: config.get('JWT_ACCESS_SECRET', { infer: true }),
  }),
})
```

Với arrow function, Nest không đọc được kiểu của tham số như với constructor của class, nên phải liệt kê rõ bằng `inject`.

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

### Bước 4a: Route đăng ký và `ZodValidationPipe`

```bash
npx nest g module auth
npx nest g controller auth --no-spec
```

`src/common/pipes/zod-validation.pipe.ts` là pipe dùng chung cho mọi route:

- Nhận schema qua constructor: `new ZodValidationPipe(registerSchema)`. Cùng một class dùng được cho mọi schema.
- `transform(value)` gọi `schema.safeParse(value)`. `safeParse` không ném lỗi mà trả về `{ success, data | error }`, nhờ đó ta tự quyết định dạng lỗi trả về.
- Sai thì `throw new UnprocessableEntityException(...)` (422), với danh sách `{ field, message }`. `field` lấy từ `issue.path.join('.')`, nên field lồng nhau sẽ có dạng `address.city`.
- Đúng thì `return result.data`, controller nhận dữ liệu **đã được làm sạch**.

Gắn pipe vào body của route:

```ts
@Post('register')
register(@Body(new ZodValidationPipe(registerSchema)) body: RegisterDto) { ... }
```

Những điểm đáng chú ý trong `registerSchema` (`src/auth/auth.schema.ts`):

- **Email:** `z.string().trim().toLowerCase().pipe(z.email())`. Email được làm sạch trước rồi mới kiểm tra, nên `" An@Gmail.COM "` và `"an@gmail.com"` là cùng một tài khoản.
- **Mật khẩu `max(72)`:** bcrypt chỉ đọc 72 byte đầu tiên, phần sau bị bỏ qua mà không báo lỗi.
- **Không có field `role`:** `z.object` tự bỏ các field không khai báo. Vì vậy client gửi `"role": "ADMIN"` cũng không có tác dụng, chặn được lỗi **mass assignment**. Mọi người đăng ký đều là `STUDENT`.
- **DTO** (Data Transfer Object) là kiểu dữ liệu client gửi lên. Ở đây DTO được sinh bằng `z.infer<typeof registerSchema>`.

### Bước 4b: Hash mật khẩu và lưu user

```bash
npm i bcrypt
npm i -D @types/bcrypt
npx nest g service auth --no-spec
```

**Tại sao phải hash mật khẩu:** nếu database bị lộ, kẻ tấn công không có được mật khẩu gốc, vì hash là biến đổi một chiều.

**bcrypt** cố tình chạy chậm (cost `10` = 2¹⁰ vòng lặp, khoảng 100ms) và tự thêm **salt** ngẫu nhiên. Vì vậy hai người cùng mật khẩu vẫn có hai hash khác nhau, và bảng hash tính sẵn (*rainbow table*) trở nên vô dụng. Salt được lưu ngay trong chuỗi hash:

```
$2b$10$kICgIiFwUk8d9aTUioAk5e RgmsvQCE67jdxZy7W7a/LE/rQ1.mdV6
 │   │  └──── salt (22 ký tự) ──┘└──── kết quả hash (31 ký tự) ──┘
 │   └─ cost = 10
 └─ phiên bản thuật toán
```

`AuthService.register()`:

- `data` được viết ra **từng field**, không dùng `data: dto`. Đây là lớp chống mass assignment thứ hai.
- `omit: { passwordHash: true }`: **không bao giờ** trả `passwordHash` về cho client.
- **Email trùng:** bắt lỗi Prisma `P2002` (vi phạm `@unique`) rồi đổi thành `ConflictException` (409). Không dùng cách "tìm trước rồi mới tạo", vì cách đó có **race condition**: 2 request đến cùng lúc đều thấy "chưa có" và đều đi tiếp. Các lỗi khác thì `throw error` tiếp ra ngoài, không được nuốt mất.

> ⚠️ Không tạo user bằng tay trong Prisma Studio với mật khẩu gốc. User đó sẽ không đăng nhập được, vì `bcrypt.compare` không đọc được chuỗi không phải hash. Tài khoản admin sẽ được tạo bằng seed script (Bước 5).

### Bước 4c: Đăng nhập và JWT

```bash
npm i @nestjs/jwt
```

**JWT** gồm 3 phần `header.payload.signature`:

- **Payload** chỉ được mã hoá base64, **ai cũng đọc được**. Không bao giờ đặt mật khẩu hay thông tin nhạy cảm vào đây.
- **Chữ ký** được tạo từ payload và `JWT_ACCESS_SECRET`. Nếu ai đó sửa payload (ví dụ đổi `role` thành `ADMIN`), chữ ký sẽ không khớp nữa. JWT **chống giả mạo**, chứ không giấu dữ liệu.

Payload của token do app tạo ra:

```json
{ "sub": "a322119b-...", "role": "STUDENT", "iat": 1791221203, "exp": 1791222103 }
```

| Trường | Ý nghĩa |
|---|---|
| `sub` | *subject*: id của user |
| `role` | quyền của user |
| `iat` | *issued at*: thời điểm tạo token (Unix timestamp, đơn vị giây) |
| `exp` | *expiration*: thời điểm hết hạn. `exp − iat = JWT_ACCESS_EXPIRES_IN` |

Cấu hình `JwtModule` trong `auth.module.ts` bằng `registerAsync` để lấy secret và thời hạn từ `ConfigService` (xem phần *Dynamic module* ở trên). `JWT_ACCESS_EXPIRES_IN` dùng **số giây** thay vì `"15m"`, vì kiểu dữ liệu của `@nestjs/jwt` không nhận một biến `string` bất kỳ đọc từ `.env`.

`AuthService.login()`:

1. `findUnique({ where: { email } })`: không tìm thấy thì trả về `null`, không ném lỗi.
2. Không có user → `UnauthorizedException` (401).
3. `bcrypt.compare(matKhauNhap, user.passwordHash)`: lấy salt từ trong hash đã lưu, hash lại mật khẩu vừa nhập với salt đó rồi so sánh. **Thứ tự tham số: mật khẩu gốc trước, hash sau.** Không thể so bằng `bcrypt.hash(...) === passwordHash`, vì mỗi lần hash ra một salt mới.
4. Sai mật khẩu → **cùng** câu báo lỗi 401 như bước 2: "Email hoặc mật khẩu không đúng". Nếu báo riêng "Email không tồn tại", kẻ xấu có thể dò ra email nào đã đăng ký (**user enumeration**).
5. `jwtService.signAsync({ sub: user.id, role: user.role })` → trả về `{ accessToken }`.

Route dùng `@HttpCode(200)`, vì mặc định Nest trả `201 Created` cho `POST`, trong khi đăng nhập không tạo ra tài nguyên mới.

### Bước 4d: `JwtAuthGuard` và `GET /auth/me`

Guard là phiên bản NestJS của middleware kiểm tra token trong Express:

```js
// Express
function requireAuth(req, res, next) {
  const [type, token] = (req.headers.authorization ?? '').split(' ');
  if (type !== 'Bearer' || !token) return res.status(401).json({ message: 'Thiếu access token' });
  try { req.user = jwt.verify(token, SECRET); next(); }
  catch { return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' }); }
}
app.get('/auth/me', requireAuth, handler);
```

| Express | NestJS (`src/auth/jwt-auth.guard.ts`) |
|---|---|
| `function requireAuth(req, res, next)` | class `JwtAuthGuard implements CanActivate`, có hàm `canActivate()` |
| `return res.status(401)...` | `throw new UnauthorizedException(...)` |
| `next()` | `return true` |
| `jwt.verify(token, SECRET)` | `this.jwtService.verifyAsync(token)`: kiểm tra cả chữ ký lẫn `exp`, secret lấy từ cấu hình `JwtModule` |
| `app.get('/me', requireAuth, handler)` | `@UseGuards(JwtAuthGuard)` đặt trên handler |

Một số điểm cần nhớ:

- `context.switchToHttp().getRequest()`: guard dùng được cho cả HTTP và WebSocket, nên phải chuyển về HTTP trước rồi mới lấy được `request`.
- Header có dạng `Authorization: Bearer <token>`, tách bằng `split(' ')` (có **dấu cách**). Viết `split('')` sẽ tách thành từng ký tự, khiến guard **luôn trả 401** mà TypeScript không báo lỗi.
- `src/auth/auth.types.ts` khai báo `AuthenticatedRequest extends Request` để thêm field `user`. Phải có dòng `import type { Request } from 'express'`. Nếu thiếu, `Request` sẽ là kiểu toàn cục của `fetch()`, kiểu đó không có `headers.authorization`.
- Trong controller, `AuthenticatedRequest` phải được import bằng **`import type`**. Nếu không, TypeScript báo lỗi `TS1272`, vì interface được dùng trong hàm có decorator (`@Req()`).
- `getMe()` lấy lại user từ DB thay vì trả luôn payload, vì token chỉ chứa dữ liệu tại thời điểm đăng nhập (user có thể đã đổi tên hoặc bị xoá).

---

### Ghi chú: port 4000

Backend chạy ở port **4000** vì frontend Next.js sẽ dùng port mặc định **3000**. Khi frontend (`localhost:3000`) gọi API (`localhost:4000`), trình duyệt coi đây là hai origin khác nhau, nên backend sẽ cần bật **CORS** khi bắt đầu làm frontend.

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
| `File .env không hợp lệ: ✖ expected number, received NaN → at JWT_ACCESS_EXPIRES_IN` | tên biến trong `.env` bị gõ sai (ví dụ `JWT_ACCESS_EXPIRESS_IN`) hoặc thiếu biến |
| `Nest can't resolve dependencies of the AuthService (PrismaService, ?)` | `AuthModule` chưa có `JwtModule` trong `imports` |
| REST Client báo `The connection was rejected` | server chưa chạy. Bật Docker Desktop trước, rồi chạy `npm run start:dev` và để terminal đó luôn mở |
| Đăng nhập luôn trả `401` dù mật khẩu đúng | user được tạo tay với mật khẩu gốc (không phải hash), hoặc truyền ngược tham số `bcrypt.compare` |
| `npm test` lỗi `Cannot find module './internal/class.js'` | Jest chưa map import đuôi `.js` của Prisma Client. Sẽ sửa khi bắt đầu viết test |
| REST Client báo `The connection was rejected` nhưng server vẫn đang chạy | server chạy ở port khác với `@baseUrl`. Đối chiếu `PORT` trong `.env` với URL trong `request.http` |
| `getaddrinfo ENOTFOUND (` | URL trong `request.http` bị thừa ngoặc. Biến chỉ có **đúng 2 cặp** ngoặc nhọn: `{{baseUrl}}/auth/me` |
| `Class 'JwtAuthGuard' incorrectly implements interface 'CanActivate'` | gõ sai tên hàm: phải là `canActivate` |
| `Property 'authorization' does not exist on type 'Headers'` | `auth.types.ts` thiếu dòng `import type { Request } from 'express'` |

---

## Lộ trình tiếp theo

- [x] Bước 1: Khởi tạo NestJS, route `/health`
- [x] Bước 2: Postgres (Docker), Prisma, `PrismaService`
- [x] Bước 3: Kiểm tra biến môi trường bằng Zod
- [ ] Bước 4: Xác thực
  - [x] 4a: `POST /auth/register`, `ZodValidationPipe`
  - [x] 4b: hash mật khẩu bằng bcrypt, lưu user, xử lý email trùng
  - [x] 4c: `POST /auth/login`, cấp JWT access token
  - [x] 4d: Guard kiểm tra token, `GET /auth/me`
  - [ ] 4e: refresh token và logout
- [ ] Bước 5: Phân quyền theo role (Student / Instructor / Admin)
- [ ] Bước 6: Khóa học (giảng viên tạo và xuất bản, học viên xem)
- [ ] Bước 7: Section và Lecture
- [ ] Bước 8: Mua hoặc ghi danh khóa học, theo dõi tiến độ
- [ ] Bước 9: Đánh giá, upload, trang quản trị cho admin…
