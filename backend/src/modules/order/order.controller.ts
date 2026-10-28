import { Request, Response } from 'express'
import * as orderService from './order.service'
import { CreateOrderBodyType, GetMyOrdersQueryType, OrderParamsType } from './order.schema'

export const createOrder = async (req: Request, res: Response) => {
  const order = await orderService.createOrder(req.user!.userId, req.body as CreateOrderBodyType)
  res.status(201).json({ message: 'Tạo đơn hàng thành công', data: order })
}

export const getMyOrders = async (req: Request, res: Response) => {
  const query = req.query as unknown as GetMyOrdersQueryType
  const result = await orderService.getMyOrders(req.user!.userId, query)
  res.json({ message: 'Lấy lịch sử mua hàng thành công', ...result })
}

export const getMyOrder = async (req: Request, res: Response) => {
  const { orderId } = req.params as unknown as OrderParamsType
  const order = await orderService.getMyOrder(orderId, req.user!.userId)
  res.json({ message: 'Lấy đơn hàng thành công', data: order })
}

export const cancelOrder = async (req: Request, res: Response) => {
  const { orderId } = req.params as unknown as OrderParamsType
  const order = await orderService.cancelOrder(orderId, req.user!.userId)
  res.json({ message: 'Đã hủy đơn hàng', data: order })
}
