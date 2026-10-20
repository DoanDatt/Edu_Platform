// Tạo 1 lần rồi dùng lại: Intl.NumberFormat khá tốn, không nên tạo mới mỗi lần định dạng
const vndFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

// 0 → 'Miễn phí', 499000 → '499.000 ₫'
export const formatPrice = (price: number) => {
  if (price === 0) {
    return 'Miễn phí'
  } else {
    return vndFormatter.format(price)
  }
}

// Tổng thời lượng: 3240 giây → '54 phút', 8100 → '2 giờ 15 phút', 7200 → '2 giờ'
export const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600) // số giờ tròn
  const minutes = Math.round((seconds % 3600) / 60) // % 3600: số giây CÒN LẠI sau khi bỏ các giờ tròn
  if (hours > 0 && minutes > 0) return `${hours} giờ ${minutes} phút`
  if (hours > 0) return `${hours} giờ`
  return `${minutes} phút`
}

// Thời lượng 1 bài dạng đồng hồ: 300 → '05:00', 425 → '07:05', 3725 → '1:02:05'
export const formatClock = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  // padStart(2, '0'): thêm '0' vào ĐẦU cho đủ 2 ký tự → 5 → '05'
  const mm = String(minutes).padStart(2, '0')
  const ss = String(secs).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

// Ngày dạng Việt Nam: '2026-10-11T20:37:49.299Z' → '12/10/2026' (theo giờ máy người xem)
export const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN')

// Bỏ dấu tiếng Việt: 'Lập trình Đà Nẵng' → 'Lap trinh Da Nang'
export const removeAccents = (text: string) =>
  text
    .normalize('NFD') // tách chữ và dấu: 'ế' → 'e' + dấu mũ + dấu sắc
    .replace(/[̀-ͯ]/g, '') // xóa các dấu vừa tách ra
    .replace(/đ/g, 'd') // 'đ' không tách được bằng normalize nên đổi riêng
    .replace(/Đ/g, 'D')

// Tạo slug cho URL trang chi tiết: tên dễ đọc (tốt cho SEO) + id để lấy lại dữ liệu
//   ('React từ cơ bản đến nâng cao', 15) → 'react-tu-co-ban-den-nang-cao-i.15'
//   ('Node.js & Express', 16)            → 'node-js-express-i.16'
// Dùng '-i.' làm dấu ngăn cách vì tên có thể chứa số ('HTML5 2025') nhưng gần như không chứa '-i.'
export const generateSlugUrl = ({ name, id }: { name: string; id: number }) => {
  const text = removeAccents(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // ký tự không phải chữ / số (dấu cách, &, ., ...) → '-'
    .replace(/^-+|-+$/g, '') // bỏ '-' thừa ở đầu và cuối
  return `${text}-i.${id}`
}

// Lấy id từ slug: 'react-tu-co-ban-i.15' → 15
// Slug sai (không có '-i.<số>') → NaN, nơi gọi tự kiểm tra bằng Number.isInteger
export const getIdFromSlugUrl = (slug: string) => Number(slug.split('-i.').pop())
