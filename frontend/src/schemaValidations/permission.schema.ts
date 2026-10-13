import z from 'zod'
import { HTTPMethod } from '@/constants/type'
import { PaginationQuery, PaginationRes } from './common.schema'

// Trang quản trị phân quyền (chỉ admin)

export const PermissionSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  path: z.string(), // dạng Express, ví dụ /courses/:courseId
  method: z.enum(HTTPMethod),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
})
export type PermissionType = z.infer<typeof PermissionSchema>

// GET /permissions?page&limit
export const GetPermissionsQuery = PaginationQuery
export type GetPermissionsQueryType = z.infer<typeof GetPermissionsQuery>

export const PermissionListRes = PaginationRes.extend({
  data: z.array(PermissionSchema),
  message: z.string()
})
export type PermissionListResType = z.infer<typeof PermissionListRes>

// GET /permissions/:id, POST, PUT
export const PermissionRes = z.object({
  data: PermissionSchema,
  message: z.string()
})
export type PermissionResType = z.infer<typeof PermissionRes>

// Copy từ backend
// POST /permissions
export const CreatePermissionBody = z
  .object({
    name: z.string().trim().min(1, 'Vui lòng nhập tên').max(500),
    description: z.string().trim().max(1000).optional(),
    path: z.string().trim().min(1).max(1000).startsWith('/', 'Path phải bắt đầu bằng /'),
    method: z.enum(HTTPMethod)
  })
  .strict()
export type CreatePermissionBodyType = z.infer<typeof CreatePermissionBody>

// PUT /permissions/:id: gửi lại đầy đủ các field
export const UpdatePermissionBody = CreatePermissionBody
export type UpdatePermissionBodyType = z.infer<typeof UpdatePermissionBody>

// DELETE /permissions/:id → dùng MessageRes trong common.schema
