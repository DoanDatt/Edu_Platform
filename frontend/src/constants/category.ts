import { BarChart3, Code, LayoutGrid, LucideIcon, Megaphone, Palette } from 'lucide-react'

// DB không lưu icon / màu cho danh mục → tự gán theo tên.
// Danh mục mới (admin thêm sau) không có trong bảng → icon LayoutGrid + màu chọn theo id.
// Màu nền ảnh bìa tự vẽ: các dải màu NHẠT lấy từ chính banner của EduPress (vàng → xanh ngọc ở hero,
// hồng → xanh nhạt ở banner theme, xanh ngọc → cam đào ở banner add-on) → chữ đen đọc rõ, hợp tông cam
const categoryStyles: Record<string, { Icon: LucideIcon; gradient: string }> = {
  'Lập trình Web': { Icon: Code, gradient: 'from-[#fff5be] to-[#d0f7ea]' },
  'Thiết kế': { Icon: Palette, gradient: 'from-[#feb6b6] to-[#b7e1ff]' },
  Marketing: { Icon: Megaphone, gradient: 'from-[#b4f5e0] to-[#ffc6b8]' },
  'Khoa học dữ liệu': { Icon: BarChart3, gradient: 'from-[#ffe4c4] to-[#ffd1e0]' }
}

// Màu dự phòng cho danh mục lạ. Viết ĐỦ tên class (không ghép chuỗi kiểu `from-${color}-500`):
// Tailwind chỉ tạo CSS cho class nó đọc thấy nguyên văn trong code
const fallbackGradients = ['from-[#e0f2ff] to-[#fff5be]', 'from-[#d0f7ea] to-[#e3e0ff]', 'from-[#f5f5f5] to-[#ffe4c4]']

// Icon cam của EduPress (tải từ Figma, public/edupress/icons) cho ô danh mục ở trang chủ.
// Danh mục lạ → lần lượt các icon còn lại của Figma theo id
const categoryIcons: Record<string, string> = {
  'Lập trình Web': 'category-development.svg',
  'Thiết kế': 'category-design.svg',
  Marketing: 'category-marketing.svg',
  'Khoa học dữ liệu': 'category-science.svg'
}
const fallbackIcons = [
  'category-communication.svg',
  'category-videography.svg',
  'category-photography.svg',
  'category-writing.svg',
  'category-finance.svg',
  'category-network.svg'
]

export const getCategoryIcon = (category: { id: number; name: string }) =>
  `/edupress/icons/${categoryIcons[category.name] ?? fallbackIcons[category.id % fallbackIcons.length]}`

export const getCategoryStyle = (category: { id: number; name: string }) =>
  categoryStyles[category.name] ?? {
    Icon: LayoutGrid,
    gradient: fallbackGradients[category.id % fallbackGradients.length]
  }
