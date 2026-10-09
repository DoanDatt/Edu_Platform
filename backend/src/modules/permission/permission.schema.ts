import z from 'zod'
import { HTTPMethod } from '../../generated/prisma/enums'
import { PaginationQuerySchema } from '../../utils/pagination'

// /permission/:permissionId -> '5' thành 5, 'abc' hoặc '0' thì 422
export const PermissionParamsSchema = z
  .object({
    permissionId: z.coerce.number().int().positive(),
  })
  .strict()
export type PermissionParamsType = z.infer<typeof PermissionParamsSchema>

// ?page=2&limit=10, dùng chung schema phân trang
export const GetPermissionQuerySchema = PaginationQuerySchema

export type GetPermissionQueryType = z.infer<typeof GetPermissionQuerySchema>

export const CreatePermissionBodySchema = z
  .object({
    name: z.string().trim().min(1, 'Vui lòng nhập tên').max(500),
    description: z.string().trim().max(1000).optional(),
    // Đường dẫn dạng Express, ví trụ: /permission/:permissionId
    path: z.string().trim().min(1).max(1000).startsWith('/', 'Path phải bắt đầu bằng /'),
    // chỉ nhận các giá trị trong enum HttpMethod của Prisma: GET,POST,PUT,..
    method: z.enum(HTTPMethod),
  })
  .strict()

export type CreatePermissionBodyType = z.infer<typeof CreatePermissionBodySchema>

// PUT =  gửi lại đầy đủ các field, nên dùng chung schema với tạo mới
export const UpdatePermissionBodySchema = CreatePermissionBodySchema

export type UpdatePermissionBodyType = z.infer<typeof UpdatePermissionBodySchema>
