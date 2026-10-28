import { Router } from 'express'
import * as orderController from './order.controller'
import { requireAuth } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.middleware'
import { CreateOrderBodySchema, GetMyOrdersQuerySchema, OrderParamsSchema } from './order.schema'
import * as paymentController from '../payment/payment.controller'
import { StartPaymentBodySchema } from '../payment/payment.schema'

// Đơn hàng của CHÍNH MÌNH: ai đăng nhập cũng mua được (giống /profile, /notifications) → chỉ cần requireAuth.
// Service luôn kiểm tra đơn thuộc về req.user nên không xem / hủy được đơn của người khác
const orderRouter = Router()
orderRouter.use(requireAuth)

orderRouter.post('/', validateBody(CreateOrderBodySchema), orderController.createOrder)
// "/mine" phải đứng TRƯỚC "/:orderId" (cùng method GET)
orderRouter.get('/mine', validateQuery(GetMyOrdersQuerySchema), orderController.getMyOrders)
orderRouter.get('/:orderId', validateParams(OrderParamsSchema), orderController.getMyOrder)
orderRouter.post('/:orderId/cancel', validateParams(OrderParamsSchema), orderController.cancelOrder)
// Thanh toán đơn: chọn cổng → link / thông tin chuyển khoản; cổng trả về → kiểm tra lại trạng thái
orderRouter.post(
  '/:orderId/pay',
  validateParams(OrderParamsSchema),
  validateBody(StartPaymentBodySchema),
  paymentController.startPayment,
)
orderRouter.post('/:orderId/confirm', validateParams(OrderParamsSchema), paymentController.confirmPayment)

export default orderRouter
