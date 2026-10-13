import z from 'zod'
import { UserStatus } from '../../generated/prisma/enums'
import { PaginationQuerySchema } from '../../utils/pagination'

export const UserParamsSchema = z
  .object({
    userId: z.coerce.number().int().positive(),
  })
  .strict()

export type UserParamsType = z.infer<typeof UserParamsSchema>

// ?search=an&roleId=2&status=BLOCKED&page=1&limit=10
export const GetUsersQuerySchema = PaginationQuerySchema.extend({
  // Tìm theo tên hoặc email
  search: z.string().trim().max(200).optional(),
  roleId: z.coerce.number().int().positive().optional(),
  status: z.enum(UserStatus).optional(),
}).strict()

export type GetUsersQueryType = z.infer<typeof GetUsersQuerySchema>

export const UpdateUserStatusBodySchema = z
  .object({
    status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED]),
  })
  .strict()

export type UpdateUserStatusBodyType = z.infer<typeof UpdateUserStatusBodySchema>

export const UpdateUserRoleBodySchema = z
  .object({
    roleId: z.number().int().positive(),
  })
  .strict()

export type UpdateUserRoleBodyType = z.infer<typeof UpdateUserRoleBodySchema>
