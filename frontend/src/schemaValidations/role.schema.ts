import z from 'zod'
import { PaginationRes } from './common.schema'

export const RoleSchema = z.object({
  id: z.number(),
  name: z.string()
})
export type RoleItemType = z.infer<typeof RoleSchema>

export const RoleListRes = PaginationRes.extend({
  data: z.array(RoleSchema),
  message: z.string()
})
export type RoleListResType = z.infer<typeof RoleListRes>
