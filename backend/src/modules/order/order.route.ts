import { Router } from 'express'
import * as orderController from './order.controller'
import { requireAuth } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.middleware'
import { CreateOrderBodySchema, GetMyOrdersQuerySchema, OrderParamsSchema } from './order.schema'

// Đơn hàng của CHÍNH MÌNH: ai đăng nhập cũng mua được (giống /profile, /notifications) → chỉ cần requireAuth.
// Service luôn kiểm tra đơn thuộc về req.user nên không xem / hủy được đơn của người khác
const orderRouter = Router()
orderRouter.use(requireAuth)

orderRouter.post('/', validateBody(CreateOrderBodySchema), orderController.createOrder)
// "/mine" phải đứng TRƯỚC "/:orderId" (cùng method GET)
orderRouter.get('/mine', validateQuery(GetMyOrdersQuerySchema), orderController.getMyOrders)
orderRouter.get('/:orderId', validateParams(OrderParamsSchema), orderController.getMyOrder)
orderRouter.post('/:orderId/cancel', validateParams(OrderParamsSchema), orderController.cancelOrder)

export default orderRouter
