# Danh sách chức năng Edu Platform

Tổng hợp mọi chức năng để Edu Platform thành một dự án hoàn chỉnh, chia theo người dùng.
Dùng để theo dõi tiến độ và làm nguồn khi cập nhật CV / README.

Trạng thái ngày 30/10/2026: ✅ xong · 🚧 đang làm · ⬜ chưa làm · 💡 ý tưởng thêm (làm hay không tùy chọn)

## Tổng quan

| Nhóm | Xong | Còn lại |
|---|---|---|
| 1. Khách (chưa đăng nhập) | Trang chủ, danh sách, chi tiết, tìm kiếm, Blog, Giới thiệu | Xem thử video bài preview |
| 2. Tài khoản | Đăng ký, đăng nhập, đăng xuất, giữ đăng nhập, hồ sơ, đổi mật khẩu, quên mật khẩu | Xử lý tài khoản bị khóa |
| 3. Học viên | Ghi danh, mua khóa có phí, đơn hàng, khóa của tôi, trang học (xem đủ 90%), đánh giá | Giao diện làm quiz |
| 4. Giảng viên | Dashboard (có doanh thu thật), soạn bài, gửi duyệt, học viên | Giao diện soạn quiz |
| 5. Admin | Dashboard (có doanh thu thật), duyệt khóa học, danh mục, người dùng | Phân quyền |
| 6. Thông báo | Backend + chuông ở header | Realtime SSE |
| 7. Giao diện và chất lượng | Sáng / tối, điện thoại, song ngữ Việt – Anh trang công khai, Next.js 16.4.3 | Giao diện EduPress từ bước 3, dịch dashboard, trang lỗi / 404, SEO, cache |
| 8. Backend và hạ tầng | Gần như đủ, 83 test | Email khi deploy |

---

## 1. Khách (chưa đăng nhập)

- ✅ **Trang chủ dạng landing page:** banner tràn ngang, danh mục dạng ô ảnh (ảnh nền lấy từ khóa đông học viên nhất), khóa nổi bật, khóa miễn phí, băng cảm nhận học viên chạy ngang, khối kêu gọi đăng ký
- ✅ **Danh sách khóa học `/courses`:** tìm kiếm, lọc danh mục / trình độ / giá, sắp xếp, phân trang; mọi bộ lọc nằm trên URL (chia sẻ link là ra đúng kết quả)
- ✅ **Thẻ khóa học chi tiết:** số bài học, số học viên, điểm đánh giá, giá
- ✅ **Header:** menu xổ xuống dạng tấm lớn, menu Dashboard theo vai trò, ô tìm kiếm có chọn danh mục
- ✅ **Chi tiết khóa học:** giới thiệu, mục lục đánh số (mở rộng / thu gọn tất cả), khung giá dính khi cuộn, đánh giá + phân bố sao
- ✅ **SEO trang chi tiết:** tiêu đề / mô tả / Open Graph theo từng khóa, URL dạng `ten-khoa-i.15`, link sai chữ tự chuyển về URL chuẩn
- ✅ **Ảnh bìa tự vẽ** theo danh mục khi khóa chưa có ảnh
- ✅ **Blog** (danh sách + bài viết) và **trang Giới thiệu**
- ⬜ **Xem thử bài preview:** bấm bài có nhãn "Xem thử" để phát video ngay trên trang chi tiết (hiện mới có nhãn; backend đã trả link video của bài xem thử)

## 2. Tài khoản và xác thực

- ✅ Đăng ký, đăng nhập: token lưu cookie httpOnly do Route Handler của Next.js đặt; trang đăng nhập / đăng ký chia đôi màn hình
- ✅ Giữ đăng nhập: tự làm mới access token, nhiều request hết hạn cùng lúc chỉ gọi refresh **1 lần**
- ✅ Chặn trang theo đăng nhập và theo role trong `proxy.ts` (gồm `/my-orders`, `/checkout`); chỉ còn refresh token thì chuyển qua trang làm mới
- ✅ Đăng xuất (xóa cookie, localStorage, refresh token trong DB)
- ✅ Hồ sơ: sửa tên, số điện thoại, ảnh đại diện (upload Cloudinary, xem trước trước khi lưu)
- ✅ Đổi mật khẩu: các thiết bị khác bị đăng xuất, thiết bị đang dùng nhận cặp token mới
- ✅ **Quên mật khẩu 3 bước:** nhập email → nhận mã OTP qua email → xác minh mã → đặt mật khẩu mới
- ⬜ **Tài khoản bị admin khóa:** request tiếp theo nhận 403 → tự đăng xuất, báo lý do
- 💡 Xác thực email khi đăng ký
- 💡 Đăng nhập bằng Google

## 3. Học viên

- ✅ Ghi danh khóa miễn phí; nút trên trang chi tiết đổi theo trạng thái (Đăng nhập để ghi danh / Ghi danh / Mua / Vào học)
- ✅ **Mua khóa có phí:** tạo đơn hàng → trang thanh toán chọn cổng (hủy được đơn chưa trả) → trang kết quả
  - **MoMo** (môi trường thử nghiệm, nhận IPN)
  - **PayPal** sandbox (tự đổi VND → USD)
  - **SePay** chuyển khoản ngân hàng thật (mã QR, webhook xác nhận)
  - Bật / tắt từng cổng bằng biến môi trường
- ✅ **Đơn hàng của tôi `/my-orders`:** danh sách đơn và trạng thái
- ✅ **Khóa học của tôi:** tổng kết, thẻ "Học tiếp", bộ lọc, thanh tiến độ, nút Bắt đầu / Tiếp tục / Xem lại
- ✅ **Trang học:** video + nội dung bài, mục lục có dấu ✓, mở lại thì vào đúng bài đang học dở
- ✅ **Xem đủ 90% video mới tính học xong:** trình phát đếm thời gian xem thật (tua không tính), lưu tiến độ lên server, chưa đủ thì hiện thanh "đã xem x%"
- 🚧 **Quiz cuối bài:** backend xong (lấy đề, nộp bài, chấm điểm); chưa có giao diện làm bài
- ✅ **Đánh giá:** viết / sửa / xóa (phải ghi danh mới được đánh giá)
- 💡 Chứng chỉ hoàn thành khóa học (PDF)
- 💡 Ghi chú cá nhân khi học từng bài
- 💡 Hỏi đáp theo bài giảng (học viên hỏi, giảng viên trả lời)
- 💡 Danh sách yêu thích (wishlist)

## 4. Giảng viên

- ✅ **Dashboard:** tổng khóa, học viên, điểm đánh giá trung bình, số chờ duyệt, khóa theo trạng thái, top khóa, **doanh thu thật**
- ✅ **Khóa học của tôi:** bảng lọc theo trạng thái, phân trang, hiện lý do bị từ chối, menu thao tác
- ✅ **Tạo / sửa khóa:** một form dùng chung, upload ảnh bìa, chọn danh mục / trình độ / ngôn ngữ, giá
- ✅ **Soạn nội dung:** thêm / đổi tên / xóa / đổi thứ tự chương và bài, upload video (tự lấy thời lượng), nội dung bài, đánh dấu bài xem thử
- 🚧 **Soạn quiz cho bài:** backend xong (tạo / sửa câu hỏi); chưa có giao diện
- ✅ **Gửi duyệt** (cần ít nhất 1 bài), thông báo theo từng trạng thái (Nháp / Chờ duyệt / Bị từ chối / Đã xuất bản)
- ✅ Xóa khóa Nháp / Bị từ chối
- ✅ **Học viên của khóa:** danh sách + tiến độ từng người, phân trang
- 💡 Biểu đồ học viên mới theo thời gian
- 💡 Trả lời đánh giá của học viên

## 5. Admin

- ✅ **Duyệt khóa học:** tab theo trạng thái, tìm theo tên; xem nội dung + phát video từng bài; Duyệt / Từ chối / Gỡ khóa (bắt buộc lý do, giảng viên nhận email + thông báo)
- ✅ **Dashboard `/admin`:** thẻ số liệu (người dùng, khóa học, ghi danh, đánh giá), khối "Cần xử lý" (khóa chờ duyệt), người dùng theo vai trò, khóa học theo trạng thái
- ✅ **Doanh thu trên dashboard:** biểu đồ 30 ngày, khóa bán chạy, lấy từ đơn hàng thật
- ✅ **Quản lý người dùng:** tìm kiếm, lọc vai trò / trạng thái trên URL, khóa / mở tài khoản, đổi vai trò (không tự khóa / tự đổi vai trò mình)
- ✅ **Quản lý danh mục:** thêm / sửa trong hộp thoại, xóa (không xóa được danh mục còn khóa học)
- ⬜ Phân quyền: xem vai trò, tick chọn permission (backend có API, chưa có trang); có thể thêm vai trò "admin xem thử" chỉ đọc cho nhà tuyển dụng
- 💡 Xóa đánh giá vi phạm (backend đã cho admin xóa)

## 6. Thông báo

- ✅ **Backend:** bảng Notification, API danh sách / số chưa đọc / đánh dấu đã đọc; tạo thông báo khi gửi duyệt (→ admin), duyệt / từ chối / gỡ (→ giảng viên), ghi danh và đánh giá (→ giảng viên)
- ✅ **Chuông ở header:** số chưa đọc cập nhật 30 giây / lần và khi quay lại tab, bấm thông báo thì mở đúng trang; có thông báo mới thì tự làm mới dữ liệu liên quan
- ⬜ **Realtime bằng SSE:** server đẩy thông báo ngay (giữ polling làm dự phòng khi mất kết nối)
- 💡 Trang "Tất cả thông báo" có phân trang

## 7. Giao diện và chất lượng

- 🚧 **Giao diện EduPress** (theo bản Figma): xong bước 1–2 (màu cam, font Exo, header 1 hàng, footer 4 cột); tiếp theo là trang chủ
- ✅ Giao diện sáng / tối, dùng được trên điện thoại
- ✅ Skeleton khi tải, trạng thái rỗng, báo lỗi theo từng khối (một API lỗi không làm sập cả trang)
- ✅ **Song ngữ Việt – Anh** bằng next-intl, ngôn ngữ nằm trên URL (`/en/...`, tiếng Việt không có tiền tố); đã dịch các trang công khai
- ⬜ Dịch các trang dashboard (học viên, giảng viên, admin)
- ✅ Nâng Next.js lên 16.4.3 (bản vá bảo mật)
- ⬜ `loading.tsx`, `error.tsx`, `not-found.tsx` đẹp cho từng khu
- ⬜ SEO toàn trang: `sitemap.ts`, `robots.ts`
- ⬜ **Cache trang công khai** (`'use cache'` + `revalidateTag` khi admin duyệt / gỡ) để tải nhanh hơn
- ⬜ Kiểm tra Lighthouse (hiệu năng, khả năng truy cập) và sửa các điểm thấp
- 💡 Test frontend (Vitest + Testing Library) cho vài component / hook quan trọng

## 8. Backend và hạ tầng

- ✅ Express + Prisma + PostgreSQL; phân quyền theo role và bảng permission
- ✅ Đơn hàng + thanh toán 3 cổng (MoMo, PayPal, SePay), thống kê doanh thu
- ✅ Theo dõi thời gian xem video, quiz cuối bài
- ✅ Hàng đợi email bằng BullMQ + Redis; dọn dữ liệu cũ hằng ngày
- ✅ Upload ảnh / video lên Cloudinary (kiểm tra nội dung thật của file)
- ✅ Bảo mật: helmet, giới hạn số request, mật khẩu băm bcrypt, OTP lưu dạng băm
- ✅ 83 test (Vitest + Supertest), GitHub Actions CI, tài liệu API, bộ Postman
- ✅ Deploy: Vercel (frontend), Render (backend), Neon (PostgreSQL), Render Key Value (Redis)
- 🚧 Gửi email khi deploy qua Brevo HTTP API (code xong, cần đặt `BREVO_API_KEY` + `MAIL_FROM` trên Render)
- 💡 Ping định kỳ (UptimeRobot) để Render không ngủ, giảm thời gian chờ lần đầu mở web

---

## Chức năng muốn thêm

<!-- Ghi thêm chức năng của bạn ở đây, ví dụ:
- ⬜ Tên chức năng: mô tả ngắn
-->
