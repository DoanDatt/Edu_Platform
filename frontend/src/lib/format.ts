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
