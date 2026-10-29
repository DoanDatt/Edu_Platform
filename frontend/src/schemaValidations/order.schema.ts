import { OrderStatus, PaymentMethod } from '@/constants/type'
import z from 'zod'
import { PaginationQuery, PaginationRes } from './common.schema'

export const OrderSchema = z.object({
  id: z.number(),
  code: z.string(),
  amount: z.number(),
  status: z.enum(OrderStatus),
  method: z.enum(PaymentMethod).nullable(),
  paidAt: z.string().nullable(),
  createdAt: z.string(),
  course: z.object({
    id: z.number(),
    title: z.string(),
    thumbnail: z.string().nullable(),
    category: z.object({
      id: z.number(),
      name: z.string()
    })
  })
})

export type OrderType = z.infer<typeof OrderSchema>

export const OrderRes = z.object({
  data: OrderSchema,
  message: z.string()
})
export type OrderResType = z.infer<typeof OrderRes>

export const GetMyOrdersQuery = PaginationQuery.extend({
  status: z.enum(OrderStatus).optional()
})
export type GetMyOrdersQueryType = z.infer<typeof GetMyOrdersQuery>

export const OrderListRes = PaginationRes.extend({
  data: z.array(OrderSchema),
  message: z.string()
})
export type OrderListResType = z.infer<typeof OrderListRes>

export const CreateOrderBody = z.object({
  courseId: z.number()
})
export type CreateOrderBodyType = z.infer<typeof CreateOrderBody>

export const StartPaymentBody = z.object({
  method: z.enum(PaymentMethod)
})
export type StartPaymentBodyType = z.infer<typeof StartPaymentBody>

export const StartPaymentRes = z.object({
  data: z.object({
    method: z.enum(PaymentMethod),
    payUrl: z.string().optional(),
    transfer: z
      .object({
        bank: z.string(),
        accountNumber: z.string(),
        accountName: z.string().nullable(),
        amount: z.number(),
        content: z.string(),
        qrUrl: z.string()
      })
      .optional()
  }),
  message: z.string()
})
export type StartPaymentResType = z.infer<typeof StartPaymentRes>

export const PaymentMethodRes = z.object({
  data: z.array(z.enum(PaymentMethod)),
  message: z.string()
})
export type PaymentMethodResType = z.infer<typeof PaymentMethodRes>
