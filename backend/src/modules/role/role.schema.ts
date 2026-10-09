import z from 'zod'
import { PaginationQuerySchema } from '../../utils/pagination'

// roles/:roleId
export const RoleParamsSchema = z
  .object({
    roleId: z.coerce.number().int().positive(),
  })
  .strict()

export type RoleParamsType = z.infer<typeof RoleParamsSchema>

export const GetRolesQuerySchema = PaginationQuerySchema

export type GetRolesQueryType = z.infer<typeof GetRolesQuerySchema>

//[3,1,3] -> [3,1]: bỏ id trùng để không gán 1 permission 2 lần
// transform biến đổi kiểu dữ liệu sau khi kiểm tra,
// new Set(ids) loại bỏ phần tử trùng, sau đó [...set] chuyển ngược về mảng,
// Client gửi [3,1,3] thì service nhận được là [3,1]
const PermissionIdsSchema = z.array(z.number().int().positive()).transform((ids) => [...new Set(ids)])

// Phần chung của tạo và sửa
const RoleBodyBaseSchema = z.object({
  // 'assistant' -> "ASSISTANT", cùng kiểu với ADMIN, STUDENT,...
  name: z.string().trim().min(1, 'Vui lòng nhập tên role').max(500).toUpperCase(),
  description: z.string().trim().max(1000).optional(),
  // không gửi thì DB để true (@default(true))
  isActive: z.boolean().optional(),
})

// Tạo mới: không gửi permissionIds thì coi như role chưa có quyền nào
export const CreateRoleBodySchema = RoleBodyBaseSchema.extend({
  permissionIds: PermissionIdsSchema.default([]),
}).strict()

export type CreateRoleBodyType = z.infer<typeof CreateRoleBodySchema>

// Sửa: BẮT BUỘC gửi permissionIds, vì service dùng `set` thay toàn bộ quyền
// (quên gửi mà có default [] thì role sẽ mất sạch quyền)
export const UpdateRoleBodySchema = RoleBodyBaseSchema.extend({
  permissionIds: PermissionIdsSchema,
}).strict()

export type UpdateRoleBodyType = z.infer<typeof UpdateRoleBodySchema>
