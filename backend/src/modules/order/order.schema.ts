import z from 'zod'
import { OrderStatus } from '../../generated/prisma/enums'
import { PaginationQuerySchema } from '../../utils/pagination'

export const OrderParamsSchema = z
  .object({
    orderId: z.coerce.number().int().positive(),
  })
  .strict()

export type OrderParamsType = z.infer<typeof OrderParamsSchema>

// Mua 1 khóa học có phí
export const CreateOrderBodySchema = z
  .object({
    courseId: z.number().int().positive(),
  })
  .strict()

export type CreateOrderBodyType = z.infer<typeof CreateOrderBodySchema>

// ?status=PAID&page=1&limit=10 → lịch sử mua hàng của chính mình
export const GetMyOrdersQuerySchema = PaginationQuerySchema.extend({
  status: z.enum(OrderStatus).optional(),
}).strict()

export type GetMyOrdersQueryType = z.infer<typeof GetMyOrdersQuerySchema>
