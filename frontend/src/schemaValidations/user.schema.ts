import { UserStatus } from '@/constants/type'
import z from 'zod'
import { PaginationQuery, PaginationRes } from './common.schema'

export const UserSchema = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string(),
  phoneNumber: z.string(),
  avatar: z.string().nullable(),
  status: z.enum(UserStatus),
  role: z.object({
    id: z.number(),
    name: z.string()
  }),
  createdAt: z.string()
})

export type UserType = z.infer<typeof UserSchema>

export const UserListRes = PaginationRes.extend({
  data: z.array(UserSchema),
  message: z.string()
})

export type UserListResType = z.infer<typeof UserListRes>

export const GetUsersQuery = PaginationQuery.extend({
  search: z.string().trim().max(200).optional(),
  roleId: z.coerce.number().int().positive().optional(),
  status: z.enum(UserStatus).optional()
}).strict()
export type GetUsersQueryType = z.infer<typeof GetUsersQuery>

export const UpdateUserStatusBodySchema = z.object({
  status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED])
}).strict()
export type UpdateUserStatusBodyType = z.infer<typeof UpdateUserStatusBodySchema>

export const UpdateUserRoleBodySchema = z.object({
  roleId: z.number().int().positive()
}).strict()

export type UpdateUserRoleBodyType = z.infer<typeof UpdateUserRoleBodySchema>

export const UserResSchema = z.object({
  message: z.string(),
  data: UserSchema
})
export type UserResType = z.infer<typeof UserResSchema>
