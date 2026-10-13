import z from 'zod'

export const MessageRes = z.object({
  message: z.string()
})
export type MessageResType = z.infer<typeof MessageRes>

// Copy từ backend: query ?page=1&limit=10
export const PaginationQuery = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10)
  })
  .strict()
export type PaginationQueryType = z.infer<typeof PaginationQuery>

// Frontend tự thêm: phần phân trang có trong mọi response danh sách
export const PaginationRes = z.object({
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number()
})
