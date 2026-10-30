import { BarChart3, Code, LayoutGrid, LucideIcon, Megaphone, Palette } from 'lucide-react'

// DB không lưu icon / màu cho danh mục → tự gán theo tên.
// Danh mục mới (admin thêm sau) không có trong bảng → icon LayoutGrid + màu chọn theo id.
// Mọi màu đều nằm trong DẢI MÀU BIỂN (xanh da trời → xanh ngọc → chàm): vẫn phân biệt được danh mục
// mà cả trang không bị "cầu vồng", đồng bộ với màu thương hiệu
const categoryStyles: Record<string, { Icon: LucideIcon; gradient: string }> = {
  'Lập trình Web': { Icon: Code, gradient: 'from-sky-400 via-sky-500 to-blue-700' },
  'Thiết kế': { Icon: Palette, gradient: 'from-indigo-400 via-indigo-500 to-violet-700' },
  Marketing: { Icon: Megaphone, gradient: 'from-teal-400 via-cyan-500 to-cyan-700' },
  'Khoa học dữ liệu': { Icon: BarChart3, gradient: 'from-blue-500 via-blue-700 to-indigo-900' }
}

// Màu dự phòng cho danh mục lạ. Viết ĐỦ tên class (không ghép chuỗi kiểu `from-${color}-500`):
// Tailwind chỉ tạo CSS cho class nó đọc thấy nguyên văn trong code
const fallbackGradients = [
  'from-cyan-400 via-sky-500 to-blue-600',
  'from-emerald-400 via-teal-500 to-cyan-700',
  'from-slate-500 via-slate-600 to-slate-800'
]

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
