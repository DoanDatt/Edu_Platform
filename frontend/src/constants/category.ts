import { BarChart3, Code, LayoutGrid, LucideIcon, Megaphone, Palette } from 'lucide-react'

// DB không lưu icon / màu cho danh mục → tự gán theo tên.
// Danh mục mới (admin thêm sau) không có trong bảng → icon LayoutGrid + màu chọn theo id
const categoryStyles: Record<string, { Icon: LucideIcon; gradient: string }> = {
  'Lập trình Web': { Icon: Code, gradient: 'from-sky-500 via-blue-600 to-indigo-800' },
  'Thiết kế': { Icon: Palette, gradient: 'from-fuchsia-500 via-purple-600 to-indigo-800' },
  Marketing: { Icon: Megaphone, gradient: 'from-amber-400 via-orange-500 to-red-600' },
  'Khoa học dữ liệu': { Icon: BarChart3, gradient: 'from-emerald-500 via-teal-600 to-cyan-800' }
}

// Màu dự phòng cho danh mục lạ. Viết ĐỦ tên class (không ghép chuỗi kiểu `from-${color}-500`):
// Tailwind chỉ tạo CSS cho class nó đọc thấy nguyên văn trong code
const fallbackGradients = [
  'from-rose-500 via-pink-600 to-purple-800',
  'from-lime-500 via-green-600 to-emerald-800',
  'from-slate-500 via-slate-700 to-slate-900'
]

export const getCategoryStyle = (category: { id: number; name: string }) =>
  categoryStyles[category.name] ?? {
    Icon: LayoutGrid,
    gradient: fallbackGradients[category.id % fallbackGradients.length]
  }
