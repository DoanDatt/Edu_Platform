import { notFound } from 'next/navigation'

// Bắt mọi URL không khớp trang nào (vd /abc, /vi/khoa-hoc-sai) để hiện 404 CÓ header, footer.
// Không có file này thì Next dùng trang 404 mặc định (không có giao diện, không dịch).
// Catch-all luôn được xét SAU các trang cụ thể → không chặn nhầm trang nào
export default function CatchAllNotFound() {
  notFound()
}
