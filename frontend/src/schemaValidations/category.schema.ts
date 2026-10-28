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

export const CreateCategoryBodySchema = z
  .object({
    name: z.string().trim().min(1, 'Vui lòng nhập tên danh mục').max(200),
    description: z.string().trim().max(1000).optional()
  })
  .strict()
export type CreateCategoryBodyType = z.infer<typeof CreateCategoryBodySchema>

export const UpdateCategoryBodySchema = CreateCategoryBodySchema
export type UpdateCategoryBodyType = z.infer<typeof UpdateCategoryBodySchema>

export const CategoryRes = z.object({
  message: z.string(),
  data: CategorySchema
})
export type CategoryResType = z.infer<typeof CategoryRes>
