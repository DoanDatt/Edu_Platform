# Danh sách chức năng Edu Platform

Tổng hợp mọi chức năng để Edu Platform thành một dự án hoàn chỉnh, chia theo người dùng.
Dùng để theo dõi tiến độ và làm nguồn khi cập nhật CV / README.

Trạng thái ngày 28/10/2026: ✅ xong · 🚧 đang làm · ⬜ chưa làm · 💡 ý tưởng thêm (làm hay không tùy chọn)

## Tổng quan

| Nhóm | Xong | Còn lại |
|---|---|---|
| 1. Khách (chưa đăng nhập) | Trang chủ, danh sách, chi tiết, tìm kiếm | Xem thử video bài preview |
| 2. Tài khoản | Đăng ký, đăng nhập, đăng xuất, giữ đăng nhập, hồ sơ, đổi mật khẩu | Quên mật khẩu, xử lý tài khoản bị khóa |
| 3. Học viên | Ghi danh, khóa của tôi, trang học, đánh giá | Thanh toán |
| 4. Giảng viên | Toàn bộ (dashboard → soạn bài → gửi duyệt → học viên) | |
| 5. Admin | Dashboard, duyệt khóa học, danh mục, người dùng | Phân quyền, doanh thu (cần thanh toán) |
| 6. Thông báo | Backend + chuông ở header | Realtime SSE |
| 7. Giao diện và chất lượng | Giao diện mới, sáng / tối, điện thoại | Trang lỗi / 404, SEO, cache, nâng cấp Next.js |
| 8. Backend và hạ tầng | Gần như đủ | Email khi deploy |

---

## 1. Khách (chưa đăng nhập)

- ✅ **Trang chủ:** banner 3 slide tự chuyển, danh mục, khóa nổi bật (nhiều học viên nhất), khóa miễn phí
- ✅ **Danh sách khóa học `/courses`:** tìm kiếm, lọc danh mục / trình độ / giá, sắp xếp, phân trang; mọi bộ lọc nằm trên URL (chia sẻ link là ra đúng kết quả)
- ✅ **Ô tìm kiếm ở header** (mọi trang công khai)
- ✅ **Chi tiết khóa học:** giới thiệu, mục lục đánh số (mở rộng / thu gọn tất cả), khung giá dính khi cuộn, đánh giá + phân bố sao
- ✅ **SEO trang chi tiết:** tiêu đề / mô tả / Open Graph theo từng khóa, URL dạng `ten-khoa-i.15`, link sai chữ tự chuyển về URL chuẩn
- ✅ **Ảnh bìa tự vẽ** theo danh mục khi khóa chưa có ảnh
- ⬜ **Xem thử bài preview:** bấm bài có nhãn "Xem thử" để phát video ngay trên trang chi tiết (backend đã trả link video của bài xem thử)

## 2. Tài khoản và xác thực

- ✅ Đăng ký, đăng nhập: token lưu cookie httpOnly do Route Handler của Next.js đặt
- ✅ Giữ đăng nhập: tự làm mới access token, nhiều request hết hạn cùng lúc chỉ gọi refresh **1 lần**
- ✅ Chặn trang theo đăng nhập và theo role trong `proxy.ts`; chỉ còn refresh token thì chuyển qua trang làm mới
- ✅ Đăng xuất (xóa cookie, localStorage, refresh token trong DB)
- ✅ Hồ sơ: sửa tên, số điện thoại, ảnh đại diện (upload Cloudinary, xem trước trước khi lưu)
- ✅ Đổi mật khẩu: các thiết bị khác bị đăng xuất, thiết bị đang dùng nhận cặp token mới
- ✅ **Quên mật khẩu:** nhập email → mã OTP qua email → xác minh mã → đặt mật khẩu mới
- ⬜ **Tài khoản bị admin khóa:** request tiếp theo nhận 403 → tự đăng xuất, báo lý do
- 💡 Xác thực email khi đăng ký
- 💡 Đăng nhập bằng Google

## 3. Học viên

- ✅ Ghi danh khóa miễn phí; nút trên trang chi tiết đổi theo trạng thái (Đăng nhập để ghi danh / Ghi danh / Vào học)
- ✅ **Khóa học của tôi:** thẻ khóa + thanh tiến độ, nút Bắt đầu / Tiếp tục / Xem lại
- ✅ **Trang học:** video + nội dung bài, mục lục có dấu ✓, đánh dấu đã học / bỏ đánh dấu, mở lại thì vào đúng bài đang học dở
- ✅ **Đánh giá:** viết / sửa / xóa (phải ghi danh mới được đánh giá)
- ⬜ **Thanh toán khóa có phí** (VNPay hoặc MoMo bản thử nghiệm; hiện khóa có phí trả 402)
- 💡 Chứng chỉ hoàn thành khóa học (PDF)
- 💡 Ghi chú cá nhân khi học từng bài
- 💡 Hỏi đáp theo bài giảng (học viên hỏi, giảng viên trả lời)
- 💡 Danh sách yêu thích (wishlist)

## 4. Giảng viên

- ✅ **Dashboard:** tổng khóa, học viên, điểm đánh giá trung bình, số chờ duyệt, khóa theo trạng thái, top khóa
- ✅ **Khóa học của tôi:** bảng lọc theo trạng thái, phân trang, hiện lý do bị từ chối, menu thao tác
- ✅ **Tạo / sửa khóa:** một form dùng chung, upload ảnh bìa, chọn danh mục / trình độ / ngôn ngữ, giá
- ✅ **Soạn nội dung:** thêm / đổi tên / xóa / đổi thứ tự chương và bài, upload video (tự lấy thời lượng), nội dung bài, đánh dấu bài xem thử
- ✅ **Gửi duyệt** (cần ít nhất 1 bài), thông báo theo từng trạng thái (Nháp / Chờ duyệt / Bị từ chối / Đã xuất bản)
- ✅ Xóa khóa Nháp / Bị từ chối
- ✅ **Học viên của khóa:** danh sách + tiến độ từng người, phân trang
- 💡 Biểu đồ học viên mới theo thời gian
- 💡 Trả lời đánh giá của học viên

## 5. Admin

- ✅ **Duyệt khóa học:** tab theo trạng thái, tìm theo tên; xem nội dung + phát video từng bài; Duyệt / Từ chối / Gỡ khóa (bắt buộc lý do, giảng viên nhận email + thông báo)
- ✅ **Dashboard `/admin`:** thẻ số liệu (người dùng, khóa học, ghi danh, đánh giá), khối "Cần xử lý" (khóa chờ duyệt), người dùng theo vai trò, khóa học theo trạng thái
- 🚧 **Doanh thu trên dashboard:** đã có giao diện (biểu đồ 30 ngày, khóa bán chạy) bằng **dữ liệu mẫu**, chờ phần thanh toán
- ✅ **Quản lý người dùng:** tìm kiếm, lọc vai trò / trạng thái trên URL, khóa / mở tài khoản, đổi vai trò (không tự khóa / tự đổi vai trò mình)
- ✅ **Quản lý danh mục:** thêm / sửa trong hộp thoại, xóa (không xóa được danh mục còn khóa học)
- ⬜ Phân quyền: xem vai trò, tick chọn permission (menu đang tạm ẩn); có thể thêm vai trò "admin xem thử" chỉ đọc cho nhà tuyển dụng
- 💡 Xóa đánh giá vi phạm (backend đã cho admin xóa)

## 6. Thông báo

- ✅ **Backend:** bảng Notification, API danh sách / số chưa đọc / đánh dấu đã đọc; tạo thông báo khi gửi duyệt (→ admin), duyệt / từ chối / gỡ (→ giảng viên), ghi danh và đánh giá (→ giảng viên)
- ✅ **Chuông ở header:** số chưa đọc cập nhật 30 giây / lần và khi quay lại tab, bấm thông báo thì mở đúng trang; có thông báo mới thì tự làm mới dữ liệu liên quan
- ⬜ **Realtime bằng SSE:** server đẩy thông báo ngay (giữ polling làm dự phòng khi mất kết nối)
- 💡 Trang "Tất cả thông báo" có phân trang

## 7. Giao diện và chất lượng

- ✅ Giao diện theo phong cách nền tảng học trực tuyến: header có tìm kiếm, cột icon bên trái, màu xanh chủ đạo
- ✅ Giao diện sáng / tối, dùng được trên điện thoại
- ✅ Skeleton khi tải, trạng thái rỗng, báo lỗi theo từng khối (một API lỗi không làm sập cả trang)
- ⬜ `loading.tsx`, `error.tsx`, `not-found.tsx` đẹp cho từng khu
- ⬜ SEO toàn trang: `sitemap.ts`, `robots.ts`
- ⬜ **Cache trang công khai** (`'use cache'` + `revalidateTag` khi admin duyệt / gỡ) để tải nhanh hơn
- ⬜ **Nâng cấp Next.js lên bản vá bảo mật** (16.4.0 có lỗ hổng đã biết)
- ⬜ Kiểm tra Lighthouse (hiệu năng, khả năng truy cập) và sửa các điểm thấp
- 💡 Test frontend (Vitest + Testing Library) cho vài component / hook quan trọng
- 💡 Đa ngôn ngữ (Việt / Anh)

## 8. Backend và hạ tầng

- ✅ Express + Prisma + PostgreSQL; phân quyền theo role và bảng permission
- ✅ Hàng đợi email bằng BullMQ + Redis; dọn dữ liệu cũ hằng ngày
- ✅ Upload ảnh / video lên Cloudinary (kiểm tra nội dung thật của file)
- ✅ Bảo mật: helmet, giới hạn số request, mật khẩu băm bcrypt, OTP lưu dạng băm
- ✅ 49 test (Vitest + Supertest), GitHub Actions CI, tài liệu API, bộ Postman
- ✅ Deploy: Vercel (frontend), Render (backend), Neon (PostgreSQL), Render Key Value (Redis)
- 🚧 Gửi email khi deploy qua Brevo HTTP API (code xong, cần đặt `BREVO_API_KEY` + `MAIL_FROM` trên Render)
- 💡 Ping định kỳ (UptimeRobot) để Render không ngủ, giảm thời gian chờ lần đầu mở web

---

## Chức năng muốn thêm

<!-- Ghi thêm chức năng của bạn ở đây, ví dụ:
- ⬜ Tên chức năng: mô tả ngắn
-->
