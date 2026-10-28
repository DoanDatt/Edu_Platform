import { NextFunction, Request, Response } from 'express'
import * as paymentService from './payment.service'
import { isValidSepayAuth } from './sepay'
import { OrderParamsType } from '../order/order.schema'
import { MomoIpnBodyType, SepayWebhookBodyType, StartPaymentBodyType } from './payment.schema'
import { HttpError } from '../../utils/error'

export const getPaymentMethods = (req: Request, res: Response) => {
  res.json({ message: 'Lấy phương thức thanh toán thành công', data: paymentService.getPaymentMethods() })
}

export const startPayment = async (req: Request, res: Response) => {
  const { orderId } = req.params as unknown as OrderParamsType
  const result = await paymentService.startPayment(orderId, req.user!.userId, req.body as StartPaymentBodyType)
  res.json({ message: 'Tạo giao dịch thanh toán thành công', data: result })
}

export const confirmPayment = async (req: Request, res: Response) => {
  const { orderId } = req.params as unknown as OrderParamsType
  const order = await paymentService.confirmPayment(orderId, req.user!.userId)
  res.json({ message: 'Kiểm tra thanh toán thành công', data: order })
}

// MoMo yêu cầu trả 204 (không body) trong vòng 15 giây, không thì MoMo gửi lại
export const momoIpn = async (req: Request, res: Response) => {
  await paymentService.handleMomoIpn(req.body as MomoIpnBodyType)
  res.status(204).end()
}

// Chặn trước bước kiểm tra body: sai API key thì không cần biết body là gì
export const requireSepayApiKey = (req: Request, res: Response, next: NextFunction) => {
  if (!isValidSepayAuth(req.headers.authorization)) {
    throw new HttpError(401, 'API key không hợp lệ')
  }
  next()
}

// SePay coi là đã nhận khi trả 200/201 kèm {"success": true}, không thì gửi lại (tối đa 7 lần)
export const sepayWebhook = async (req: Request, res: Response) => {
  await paymentService.handleSepayWebhook(req.body as SepayWebhookBodyType)
  res.json({ success: true })
}
