import envConfig from '../../config/env'
import { Prisma } from '../../generated/prisma/client'
import { OrderStatus, PaymentMethod } from '../../generated/prisma/enums'
import prisma from '../../lib/prisma'
import { HttpError } from '../../utils/error'
import { getMyOrder, getOwnOrder, markOrderPaid } from '../order/order.service'
import {
  createMomoPayment,
  isMomoEnabled,
  orderCodeFromMomoOrderId,
  queryMomoPayment,
  toMomoOrderId,
  verifyMomoIpn,
} from './momo'
import { capturePaypalOrder, createPaypalOrder, isPaypalEnabled, vndToUsd } from './paypal'
import { findOrderCode, getSepayTransferInfo, isSepayEnabled } from './sepay'
import { MomoIpnBodyType, SepayWebhookBodyType, StartPaymentBodyType } from './payment.schema'

// MoMo từ chối giao dịch dưới 10.000 đ
const MOMO_MIN_AMOUNT = 10_000

const enabledChecks: Record<PaymentMethod, () => boolean> = {
  [PaymentMethod.MOMO]: isMomoEnabled,
  [PaymentMethod.PAYPAL]: isPaypalEnabled,
  [PaymentMethod.SEPAY]: isSepayEnabled,
}

// Các cổng đã cấu hình đủ biến môi trường → frontend chỉ hiện những cổng này
export const getPaymentMethods = () => Object.values(PaymentMethod).filter((method) => enabledChecks[method]())

// Ghi lại mỗi lần cổng báo về. Trả false nếu giao dịch này đã ghi từ trước (cổng gửi lại)
const logPayment = async (method: PaymentMethod, externalId: string, orderId: number | null, payload: unknown) => {
  try {
    await prisma.paymentLog.create({
      data: { method, externalId, orderId, payload: payload as Prisma.InputJsonValue },
    })
    return true
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return false
    throw error
  }
}

// Webhook / IPN: lỗi nghiệp vụ (vd chuyển THIẾU tiền) chỉ ghi log rồi vẫn báo cổng "đã nhận",
// vì cổng gửi lại bao nhiêu lần cũng không đổi được kết quả. Giao dịch vẫn nằm trong PaymentLog để đối soát
const markPaidFromWebhook = async (input: Parameters<typeof markOrderPaid>[0]) => {
  try {
    await markOrderPaid(input)
  } catch (error) {
    if (!(error instanceof HttpError)) throw error
    console.warn(`[payment] Không xác nhận được đơn ${input.orderId}: ${error.message}`)
  }
}

// ===== Người mua =====

// Bấm "Thanh toán" với 1 cổng. MoMo / PayPal → payUrl (frontend chuyển trang sang cổng);
// SePay → thông tin chuyển khoản + ảnh QR (frontend hiện tại chỗ, rồi hỏi trạng thái đơn định kỳ)
export const startPayment = async (orderId: number, userId: number, { method }: StartPaymentBodyType) => {
  const order = await getOwnOrder(orderId, userId)
  if (order.status === OrderStatus.PAID) {
    throw new HttpError(409, 'Đơn hàng đã được thanh toán')
  }
  if (order.status === OrderStatus.CANCELLED) {
    throw new HttpError(409, 'Đơn hàng đã bị hủy, vui lòng mua lại')
  }
  if (!enabledChecks[method]()) {
    throw new HttpError(400, 'Phương thức thanh toán này chưa được bật')
  }

  // Cổng trả người mua về trang kết quả, trang này gọi POST /orders/:id/confirm để chốt trạng thái
  const resultUrl = `${envConfig.FRONTEND_URL}/checkout/${order.id}/result`
  const orderInfo = `Thanh toan don ${order.code}`

  if (method === PaymentMethod.MOMO) {
    if (order.amount < MOMO_MIN_AMOUNT) {
      throw new HttpError(400, 'MoMo chỉ nhận giao dịch từ 10.000 đ, vui lòng chọn cách thanh toán khác')
    }
    const momoOrderId = toMomoOrderId(order.code)
    const payUrl = await createMomoPayment({
      momoOrderId,
      amount: order.amount,
      orderInfo,
      redirectUrl: resultUrl,
      ipnUrl: `${envConfig.PUBLIC_URL}/payments/momo/ipn`,
    })
    // providerRef = giao dịch đang chờ bên cổng → confirm biết phải hỏi giao dịch nào
    await prisma.order.update({ where: { id: order.id }, data: { method, providerRef: momoOrderId } })
    return { method, payUrl }
  }

  if (method === PaymentMethod.PAYPAL) {
    const { paypalOrderId, approveUrl } = await createPaypalOrder({
      orderCode: order.code,
      amount: order.amount,
      description: order.course.title,
      returnUrl: resultUrl,
      cancelUrl: `${envConfig.FRONTEND_URL}/checkout/${order.id}`,
    })
    await prisma.order.update({ where: { id: order.id }, data: { method, providerRef: paypalOrderId } })
    return { method, payUrl: approveUrl }
  }

  await prisma.order.update({ where: { id: order.id }, data: { method } })
  return { method, transfer: getSepayTransferInfo(order.code, order.amount) }
}

// Trang kết quả gọi sau khi cổng trả người mua về: hỏi thẳng cổng xem đã trả chưa.
// MoMo: bình thường IPN đã báo trước, nhưng chạy máy local thì MoMo không gọi IPN về được → hỏi bù.
// PayPal: người mua mới chỉ DUYỆT, phải capture thì tiền mới về. SePay: chỉ chờ webhook, không hỏi được
export const confirmPayment = async (orderId: number, userId: number) => {
  const order = await getOwnOrder(orderId, userId)
  if (order.status === OrderStatus.PAID || !order.providerRef) {
    return getMyOrder(orderId, userId)
  }

  if (order.method === PaymentMethod.MOMO && isMomoEnabled()) {
    const result = await queryMomoPayment(order.providerRef)
    await logPayment(PaymentMethod.MOMO, order.providerRef, order.id, result)
    if (result.resultCode === 0) {
      await markOrderPaid({
        orderId: order.id,
        method: PaymentMethod.MOMO,
        providerRef: String(result.transId),
        paidAmount: result.amount,
      })
    }
  }

  if (order.method === PaymentMethod.PAYPAL && isPaypalEnabled()) {
    const capture = await capturePaypalOrder(order.providerRef)
    if (capture) {
      await logPayment(PaymentMethod.PAYPAL, capture.id, order.id, capture)
      // Thu bằng USD → so với số USD đúng ra phải trả. Đủ thì tính là đã trả đủ số VND của đơn
      const isEnough =
        capture.amount.currency_code === 'USD' && Number(capture.amount.value) >= Number(vndToUsd(order.amount))
      await markOrderPaid({
        orderId: order.id,
        method: PaymentMethod.PAYPAL,
        providerRef: capture.id,
        paidAmount: isEnough ? order.amount : 0,
      })
    }
  }

  return getMyOrder(orderId, userId)
}

// ===== Cổng thanh toán gọi về (không đăng nhập, xác thực bằng chữ ký / API key) =====

export const handleMomoIpn = async (body: MomoIpnBodyType) => {
  if (!isMomoEnabled() || !verifyMomoIpn(body)) {
    throw new HttpError(400, 'Chữ ký không hợp lệ')
  }
  const order = await prisma.order.findUnique({ where: { code: orderCodeFromMomoOrderId(body.orderId) } })
  await logPayment(PaymentMethod.MOMO, body.orderId, order?.id ?? null, body)
  // resultCode khác 0: người mua hủy / thẻ lỗi... → chỉ ghi log
  if (!order || body.resultCode !== 0) return

  await markPaidFromWebhook({
    orderId: order.id,
    method: PaymentMethod.MOMO,
    providerRef: String(body.transId),
    paidAmount: body.amount,
  })
}

export const handleSepayWebhook = async (body: SepayWebhookBodyType) => {
  // Tiền ra khỏi tài khoản không liên quan tới đơn hàng
  if (body.transferType !== 'in') return

  const code = findOrderCode(body.code, body.content)
  const order = code ? await prisma.order.findUnique({ where: { code } }) : null
  // Ghi log trước: SePay gửi lại cùng id → bỏ qua. Không khớp đơn nào (ghi sai nội dung) → vẫn lưu để xử lý tay
  const isNew = await logPayment(PaymentMethod.SEPAY, String(body.id), order?.id ?? null, body)
  if (!isNew || !order) return

  await markPaidFromWebhook({
    orderId: order.id,
    method: PaymentMethod.SEPAY,
    providerRef: String(body.id),
    paidAmount: body.transferAmount,
  })
}
