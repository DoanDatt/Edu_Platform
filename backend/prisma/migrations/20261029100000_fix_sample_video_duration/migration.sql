-- Sửa DỮ LIỆU (không đổi cấu trúc bảng): bài giảng dùng video mẫu của seed demo bị ghi thời lượng giả 5–9 phút,
-- trong khi video thật chỉ dài 5 giây. Từ khi "xem đủ 90% thời lượng mới tính là học xong",
-- thời lượng sai làm học viên xem hết video vẫn không hoàn thành được → đưa về đúng 5 giây.
-- Database mới (chưa seed) thì câu lệnh không sửa dòng nào
UPDATE "Lecture"
SET "durationSec" = 5
WHERE "videoUrl" = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
  AND "durationSec" <> 5;
