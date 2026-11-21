import { RoleLabels, RoleType, RoleValues } from '@/constants/type'

// 3 role mà code đang dùng theo tên: không đổi tên / tắt / xóa được (backend cũng chặn)
export const SYSTEM_ROLES: string[] = Object.values(RoleValues)

// Tên tiếng Việt; role admin tự tạo thêm không có trong RoleLabels → hiện nguyên tên
export const roleLabel = (name: string) => RoleLabels[name as RoleType] ?? name
