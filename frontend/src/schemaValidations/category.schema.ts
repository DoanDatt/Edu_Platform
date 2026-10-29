import z from 'zod'
import { PaginationQuery, PaginationRes } from './common.schema'

export const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string()
})

export type CategoryType = z.infer<typeof CategorySchema>

// Danh sách (GET /categories) có thêm số khóa ĐÃ XUẤT BẢN trong mỗi danh mục.
// Tách riêng vì API chi tiết / tạo / sửa danh mục không trả courseCount
export const CategoryListItemSchema = CategorySchema.extend({
  courseCount: z.number()
})
export type CategoryListItemType = z.infer<typeof CategoryListItemSchema>

export const CategoryListRes = PaginationRes.extend({
  data: z.array(CategoryListItemSchema),
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

export const GetCategoriesQuery = PaginationQuery
