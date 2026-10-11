import z from 'zod'
import { PaginationQuerySchema } from '../../utils/pagination'

export const CategoryParamsSchema = z
  .object({
    categoryId: z.coerce.number().int().positive(),
  })
  .strict()

export type CategoryParamsType = z.infer<typeof CategoryParamsSchema>

export const GetCategoriesQuerySchema = PaginationQuerySchema

export type GetCategoriesQueryType = z.infer<typeof GetCategoriesQuerySchema>

export const CreateCategoryBodySchema = z
  .object({
    name: z.string().trim().min(1, 'Vui lòng nhập tên danh mục').max(200),
    description: z.string().trim().max(1000).optional(),
  })
  .strict()
export type CreateCategoryBodyType = z.infer<typeof CreateCategoryBodySchema>

export const UpdateCategoryBodySchema = CreateCategoryBodySchema
export type UpdateCategoryBodyType = z.infer<typeof UpdateCategoryBodySchema>
