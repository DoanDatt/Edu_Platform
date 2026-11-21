import z from 'zod'
import { PaginationRes } from './common.schema'

export const RoleSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  isActive: z.boolean()
})
export type RoleItemType = z.infer<typeof RoleSchema>

export const RoleListRes = PaginationRes.extend({
  data: z.array(RoleSchema),
  message: z.string()
})
export type RoleListResType = z.infer<typeof RoleListRes>

// GET /roles/:id: kèm danh sách quyền đang có
export const RoleDetailRes = z.object({
  data: RoleSchema.extend({
    permissions: z.array(z.object({ id: z.number(), name: z.string(), method: z.string(), path: z.string() }))
  }),
  message: z.string()
})
export type RoleDetailResType = z.infer<typeof RoleDetailRes>

// ===== Permission: do backend tự sinh từ code (npm run sync-permissions), admin chỉ tick chọn cho role =====

export const PermissionSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  method: z.string(),
  path: z.string()
})
export type PermissionType = z.infer<typeof PermissionSchema>

export const PermissionListRes = PaginationRes.extend({
  data: z.array(PermissionSchema),
  message: z.string()
})
export type PermissionListResType = z.infer<typeof PermissionListRes>

// Tạo / sửa role. Tên backend tự đổi sang IN HOA ('assistant' → 'ASSISTANT')
export const RoleFormSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên role').max(500),
  description: z.string().trim().max(1000, 'Tối đa 1000 ký tự')
})
export type RoleFormType = z.infer<typeof RoleFormSchema>

// PUT /roles/:id: permissionIds BẮT BUỘC, thay toàn bộ danh sách quyền
export type UpdateRoleBodyType = { name: string; description?: string; isActive?: boolean; permissionIds: number[] }
export type CreateRoleBodyType = { name: string; description?: string; permissionIds?: number[] }
