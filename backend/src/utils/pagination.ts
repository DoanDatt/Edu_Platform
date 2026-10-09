// Dùng chung cho mọi API danh sách: ?page=2&limit=10

import z from 'zod'

export const PaginationQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    // Giới hạn 100 để client không gọi limit=100000 làm nặng DB
    limit: z.coerce.number().int().positive().max(100).default(10),
  })
  .strict()

export type PaginationQueryType = z.infer<typeof PaginationQuerySchema>
