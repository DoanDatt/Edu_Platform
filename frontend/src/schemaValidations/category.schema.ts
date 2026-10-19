import z from 'zod'
import { PaginationRes } from './common.schema'

export const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string()
})

export type CategoryType = z.infer<typeof CategorySchema>

export const CategoryListRes = PaginationRes.extend({
  data: z.array(CategorySchema),
  message: z.string()
})

export type CategoryListResType = z.infer<typeof CategoryListRes>
