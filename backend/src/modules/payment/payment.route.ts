import { Router } from 'express'
import * as paymentController from './payment.controller'
import { validateBody } from '../../middleware/validate.middleware'
import { MomoIpnBodySchema, SepayWebhookBodySchema } from './payment.schema'

// Route CÔNG KHAI: cổng thanh toán gọi về không có token đăng nhập.
// Thay vào đó MoMo ký HMAC, SePay gửi API key → kiểm tra trong controller / service
const paymentRouter = Router()

paymentRouter.get('/methods', paymentController.getPaymentMethods)
paymentRouter.post('/momo/ipn', validateBody(MomoIpnBodySchema), paymentController.momoIpn)
paymentRouter.post(
  '/sepay/webhook',
  paymentController.requireSepayApiKey,
  validateBody(SepayWebhookBodySchema),
  paymentController.sepayWebhook,
)

export default paymentRouter
