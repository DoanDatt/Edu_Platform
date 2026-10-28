import z from 'zod'
import { PaymentMethod } from '../../generated/prisma/enums'

// Người mua chọn cổng ở trang thanh toán
export const StartPaymentBodySchema = z
  .object({
    method: z.enum(PaymentMethod),
  })
  .strict()

export type StartPaymentBodyType = z.infer<typeof StartPaymentBodySchema>

// Body cổng thanh toán gửi tới: KHÔNG .strict() (cổng thêm trường mới thì vẫn nhận),
// chỉ kiểm tra các trường mình dùng tới. Thiếu / sai kiểu → 422, cổng sẽ gửi lại
export const MomoIpnBodySchema = z.object({
  partnerCode: z.string(),
  orderId: z.string(),
  requestId: z.string(),
  amount: z.number().int(),
  orderInfo: z.string(),
  orderType: z.string(),
  transId: z.number().int(),
  resultCode: z.number().int(),
  message: z.string(),
  payType: z.string(),
  responseTime: z.number().int(),
  extraData: z.string(),
  signature: z.string(),
})

export type MomoIpnBodyType = z.infer<typeof MomoIpnBodySchema>

export const SepayWebhookBodySchema = z.object({
  id: z.number().int(),
  gateway: z.string(),
  transactionDate: z.string(),
  accountNumber: z.string(),
  code: z.string().nullish(),
  content: z.string(),
  transferType: z.enum(['in', 'out']),
  transferAmount: z.number().int(),
  referenceCode: z.string().nullish(),
})

export type SepayWebhookBodyType = z.infer<typeof SepayWebhookBodySchema>
