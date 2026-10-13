import z from 'zod'
import { PaginationQuery, PaginationRes } from './common.schema'

// Quy ước tên:
//   ...Schema  = 1 đối tượng dữ liệu (dùng lại trong Res)
//   ...Body    = body gửi lên
//   ...Query   = query trên URL (?page=1&limit=10)
//   ...Res     = response trả về 1 đối tượng
//   ...ListRes = response trả về danh sách có phân trang

// Một danh mục, đúng như backend trả về
export const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string() // không có mô tả thì backend trả "", không phải null
})
export type CategoryType = z.infer<typeof CategorySchema>

// GET /categories?page&limit
export const GetCategoriesQuery = PaginationQuery
export type GetCategoriesQueryType = z.infer<typeof GetCategoriesQuery>

export const CategoryListRes = PaginationRes.extend({
  data: z.array(CategorySchema),
  message: z.string()
})
export type CategoryListResType = z.infer<typeof CategoryListRes>

// GET /categories/:id, POST, PUT đều trả 1 danh mục
export const CategoryRes = z.object({
  data: CategorySchema,
  message: z.string()
})
export type CategoryResType = z.infer<typeof CategoryRes>

// POST /categories (admin)
export const CreateCategoryBody = z
  .object({
    name: z.string().trim().min(1, 'Vui lòng nhập tên danh mục').max(200),
    description: z.string().trim().max(1000).optional()
  })
  .strict()
export type CreateCategoryBodyType = z.infer<typeof CreateCategoryBody>

// PUT /categories/:id (admin)
export const UpdateCategoryBody = CreateCategoryBody
export type UpdateCategoryBodyType = z.infer<typeof UpdateCategoryBody>

// DELETE /categories/:id → dùng MessageRes trong common.schema
