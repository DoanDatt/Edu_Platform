import z from 'zod'
import { PaginationQuery, PaginationRes } from './common.schema'
import { PermissionSchema } from './permission.schema'

// Trang quản trị phân quyền (chỉ admin)

export const RoleSchema = z.object({
  id: z.number(),
  name: z.string(), // không dùng enum: admin tạo được role mới ngoài ADMIN / INSTRUCTOR / STUDENT
  description: z.string(),
  isActive: z.boolean(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
})
export type RoleType = z.infer<typeof RoleSchema>

// Role kèm danh sách quyền (bản rút gọn của permission)
export const RoleWithPermissionsSchema = RoleSchema.extend({
  permissions: z.array(PermissionSchema.pick({ id: true, name: true, method: true, path: true }))
})
export type RoleWithPermissionsType = z.infer<typeof RoleWithPermissionsSchema>

// GET /roles?page&limit: danh sách KHÔNG kèm permissions
export const GetRolesQuery = PaginationQuery
export type GetRolesQueryType = z.infer<typeof GetRolesQuery>

export const RoleListRes = PaginationRes.extend({
  data: z.array(RoleSchema),
  message: z.string()
})
export type RoleListResType = z.infer<typeof RoleListRes>

// GET /roles/:id, POST, PUT: đều kèm permissions
export const RoleRes = z.object({
  data: RoleWithPermissionsSchema,
  message: z.string()
})
export type RoleResType = z.infer<typeof RoleRes>

// Copy từ backend
// [3, 1, 3] → [3, 1]: bỏ id trùng
const PermissionIds = z.array(z.number().int().positive()).transform((ids) => [...new Set(ids)])

const RoleBodyBase = z.object({
  // 'assistant' → 'ASSISTANT'
  name: z.string().trim().min(1, 'Vui lòng nhập tên role').max(500).toUpperCase(),
  description: z.string().trim().max(1000).optional(),
  isActive: z.boolean().optional()
})

// POST /roles: không gửi permissionIds thì role chưa có quyền nào
export const CreateRoleBody = RoleBodyBase.extend({
  permissionIds: PermissionIds.default([])
}).strict()
export type CreateRoleBodyType = z.infer<typeof CreateRoleBody>

// PUT /roles/:id: BẮT BUỘC gửi permissionIds, backend THAY TOÀN BỘ danh sách quyền
export const UpdateRoleBody = RoleBodyBase.extend({
  permissionIds: PermissionIds
}).strict()
export type UpdateRoleBodyType = z.infer<typeof UpdateRoleBody>

// DELETE /roles/:id → dùng MessageRes (409 nếu còn user thuộc role)
