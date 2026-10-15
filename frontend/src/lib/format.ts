// Hàm thuần (không phụ thuộc trình duyệt): dùng được cả ở Server Component lẫn Client Component

const vndFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

// 0 → "Miễn phí" · 199000 → "199.000 ₫"
export const formatPrice = (price: number) => (price === 0 ? 'Miễn phí' : vndFormatter.format(price))

// Giây → chữ: 300 → "5 phút" · 3240 → "54 phút" · 8100 → "2 giờ 15 phút"
export const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)
  if (hours === 0) return `${minutes} phút`
  return minutes === 0 ? `${hours} giờ` : `${hours} giờ ${minutes} phút`
}

// 300 → "05:00" (thời lượng bài giảng trong mục lục)
export const formatClock = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN')

// "Lập trình Web" → "Lap trinh Web": bỏ dấu tiếng Việt (đ không phải dấu nên đổi riêng)
export const removeAccents = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')

// URL đẹp cho SEO, vẫn giữ id để tra cứu: ("React từ cơ bản", 15) → "react-tu-co-ban-i.15"
export const generateSlugUrl = ({ name, id }: { name: string; id: number }) => {
  const slug = removeAccents(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // ký tự không phải chữ / số → '-'
    .replace(/^-+|-+$/g, '') // bỏ '-' ở đầu, cuối
  return `${slug}-i.${id}`
}

// "react-tu-co-ban-i.15" → 15 · sai định dạng → NaN (trang chi tiết kiểm tra rồi trả 404)
export const getIdFromSlugUrl = (slug: string) => Number(slug.split('-i.').pop())
