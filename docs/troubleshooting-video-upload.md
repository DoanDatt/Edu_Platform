# Ghi chú lỗi: kiểm tra Cloudinary local và test upload video

Ngày: 21/11/2026 · Nhánh: `feat/video-streaming` · Lúc test bước 5 (upload video khi không có Cloudinary)

## Tóm tắt

Khi kiểm tra máy local có Cloudinary hay không, mình kết luận **sai** là "không có", trong khi thực tế backend đang chạy **có** Cloudinary. Hệ quả: nghĩ rằng local chỉ test được `mode: "server"`, trong khi thật ra test được cả luồng upload thẳng lên Cloudinary và phát HLS.

Code của tính năng **không có lỗi**. Lỗi nằm ở cách kiểm tra cấu hình và ở script test.

---

## Lỗi 1 (chính): đọc nhầm `CLOUDINARY_URL` là trống

### Triệu chứng
- Lệnh kiểm tra báo `CLOUDINARY_URL` trống.
- Nhưng `POST /uploads/video/signature` trên backend cổng 4000 lại trả `mode: "cloudinary"`.

### Nguyên nhân
Trong `backend/.env`, một số dòng viết **có dấu cách quanh dấu `=`**:

```env
CLOUDINARY_URL = cloudinary://...@dxnqvgqsc
ADMIN_EMAIL = ...
```

Lệnh kiểm tra lại tìm đúng chuỗi không có dấu cách:

```bash
grep '^CLOUDINARY_URL=.\+' .env   # không khớp "CLOUDINARY_URL = ..." → báo trống
```

`dotenv` thì tự bỏ dấu cách quanh `=`, nên backend vẫn đọc được giá trị. Kết quả là lệnh kiểm tra và backend "thấy" hai thứ khác nhau.

### Cách kiểm tra đúng
- **Hỏi thẳng backend** thay vì đọc file `.env`: gọi `POST /uploads/video/signature` (đã đăng nhập) và xem `data.mode`:
  - `"cloudinary"`: có Cloudinary
  - `"server"`: không có
- Nếu vẫn muốn đọc file, dùng regex chấp nhận dấu cách:
  ```bash
  grep -E '^\s*CLOUDINARY_URL\s*=\s*\S' backend/.env
  ```
- (Tùy chọn) Sửa `.env` về dạng chuẩn `KEY=value`, không có dấu cách, cho các dòng 13–16 và 19, để công cụ nào đọc cũng ra cùng kết quả.

### Muốn tắt Cloudinary để test `mode: "server"`
Không cần sửa `.env`. Đặt biến rỗng khi chạy, vì `dotenv` không ghi đè biến đã có, kể cả biến rỗng:

```bash
cd backend
CLOUDINARY_URL='' PORT=4001 PUBLIC_URL=http://localhost:4001 npx tsx src/server.ts
```

Chạy ở cổng khác (4001) để không ảnh hưởng backend dev đang chạy ở 4000.

---

## Lỗi 2 (script test): curl trên Windows không đọc được đường dẫn `/c/...`

### Triệu chứng
`POST /uploads/video` trả về **rỗng**, các bước sau báo `Unexpected end of JSON input`.

### Nguyên nhân
Trong Git Bash, `pwd` trả đường dẫn kiểu `/c/Users/...`. `curl.exe` là chương trình Windows nên không hiểu dạng này, vì vậy `-F "file=@/c/..."` không gửi được file.

### Cách sửa
Đổi sang đường dẫn Windows bằng `cygpath -m`:

```bash
DIR="$(cygpath -m "$(pwd)")"   # → C:/Users/...
curl -F "file=@$DIR/test-video.mp4;type=video/mp4" ...
```

---

## Lỗi 3 (dọn dẹp): tắt task nền nhưng server vẫn chạy

### Triệu chứng
Đã dừng task chạy backend tạm, nhưng cổng 4001 vẫn trả 200.

### Nguyên nhân
Trên Windows, dừng `npx tsx ...` chỉ tắt tiến trình bọc ngoài, còn tiến trình `node.exe` con vẫn giữ cổng.

### Cách sửa
Tìm đúng tiến trình đang giữ cổng rồi tắt (PowerShell):

```powershell
Get-NetTCPConnection -LocalPort 4001 -State Listen |
  ForEach-Object { Get-CimInstance Win32_Process -Filter "ProcessId=$($_.OwningProcess)" } |
  Select-Object ProcessId, CommandLine
Stop-Process -Id <ProcessId>
```

Kiểm tra `CommandLine` trước khi tắt. Backend dev của mình chạy bằng `tsx watch` ở cổng 4000, **đừng** tắt nhầm.

---

## Kết quả test bước 5 (sau khi sửa)

Backend tạm cổng 4001, `CLOUDINARY_URL=''`, tài khoản `giangvien1@edu.local`:

| Bước | Kết quả |
|---|---|
| `POST /uploads/video/signature` | ✅ `mode: "server"` |
| `POST /uploads/video` (mp4 5 giây) | ✅ 201, link `localhost:4001/uploads/videos/...mp4` |
| Mở link video | ✅ HTTP 200, `video/mp4`, 24.899 bytes |
| Tạo bài rồi `GET /lectures/:id` | ✅ `hlsUrl: null` → phát mp4 |
| Dọn dẹp | ✅ đã xóa chương / bài tạm (khóa 38), 2 file mp4 test, tắt backend tạm |

## Việc còn treo

- [ ] Video test 5 giây đã lỡ upload lên Cloudinary lúc tìm lỗi: cloud `dxnqvgqsc`, `edu-platform/videos/ikqr7ergw0827x0ilaah`. Không gắn với bài giảng nào. Nếu đây là cloud production thì nên xóa trong Media Library.
- [ ] Test luồng Cloudinary (bước 1–4) ngay trên local cổng 4000, vì local thật ra **có** Cloudinary.
- [ ] (Tùy chọn) Chuẩn hóa `backend/.env` về dạng `KEY=value`.
