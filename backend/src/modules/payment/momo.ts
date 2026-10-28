import { createHmac, randomUUID, timingSafeEqual } from 'crypto'
import envConfig from '../../config/env'
import { HttpError } from '../../utils/error'
import { MomoIpnBodyType } from './payment.schema'

// Tài liệu: developers.momo.vn (Thanh toán một lần → Cổng thanh toán MoMo, API v2)

export const isMomoEnabled = () =>
  Boolean(envConfig.MOMO_PARTNER_CODE && envConfig.MOMO_ACCESS_KEY && envConfig.MOMO_SECRET_KEY)

// Chữ ký MoMo: xếp các trường theo tên A → Z, nối thành "accessKey=...&amount=...&..." rồi HMAC-SHA256 bằng secretKey.
// Mỗi API ký một nhóm trường khác nhau → truyền đúng nhóm trường đó vào
export const signMomo = (fields: Record<string, string | number>) => {
  const raw = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join('&')
  return createHmac('sha256', envConfig.MOMO_SECRET_KEY!).update(raw).digest('hex')
}

const isSameSignature = (expected: string, received: string) => {
  const a = Buffer.from(expected)
  const b = Buffer.from(received)
  return a.length === b.length && timingSafeEqual(a, b)
}

const callMomo = async <T>(path: string, body: Record<string, unknown>) => {
  const res = await fetch(`${envConfig.MOMO_ENDPOINT}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  })
  return (await res.json()) as T & { resultCode: number; message: string }
}

// Mỗi lần bấm "Thanh toán MoMo" phải gửi 1 orderId MỚI (MoMo từ chối orderId đã dùng) → mã đơn + "_" + thời điểm.
// MoMo báo về thì cắt phần trước "_" là ra mã đơn của mình
export const toMomoOrderId = (orderCode: string) => `${orderCode}_${Date.now()}`
export const orderCodeFromMomoOrderId = (momoOrderId: string) => momoOrderId.split('_')[0]

type CreateMomoPaymentInput = {
  momoOrderId: string
  amount: number
  orderInfo: string
  redirectUrl: string // trình duyệt người mua quay về đây sau khi trả (MoMo gắn thêm ?resultCode=...)
  ipnUrl: string // server MoMo gọi vào đây báo kết quả (phải là địa chỉ public, localhost không nhận được)
}

// Tạo giao dịch → trả về payUrl (trang thanh toán của MoMo)
export const createMomoPayment = async ({
  momoOrderId,
  amount,
  orderInfo,
  redirectUrl,
  ipnUrl,
}: CreateMomoPaymentInput) => {
  const fields = {
    accessKey: envConfig.MOMO_ACCESS_KEY!,
    amount,
    extraData: '',
    ipnUrl,
    orderId: momoOrderId,
    orderInfo,
    partnerCode: envConfig.MOMO_PARTNER_CODE!,
    redirectUrl,
    requestId: randomUUID(),
    requestType: envConfig.MOMO_REQUEST_TYPE,
  }
  const { accessKey: _accessKey, ...body } = fields // accessKey chỉ dùng để ký, không gửi đi
  const result = await callMomo<{ payUrl?: string }>('/v2/gateway/api/create', {
    ...body,
    lang: 'vi',
    signature: signMomo(fields),
  })
  if (result.resultCode !== 0 || !result.payUrl) {
    throw new HttpError(502, `MoMo từ chối tạo giao dịch: ${result.message}`)
  }
  return result.payUrl
}

// Hỏi MoMo trạng thái giao dịch. Dùng khi MoMo không gọi được IPN về (chạy máy local) → trang kết quả tự hỏi
export const queryMomoPayment = async (momoOrderId: string) => {
  const fields = {
    accessKey: envConfig.MOMO_ACCESS_KEY!,
    orderId: momoOrderId,
    partnerCode: envConfig.MOMO_PARTNER_CODE!,
    requestId: randomUUID(),
  }
  const { accessKey: _accessKey, ...body } = fields
  return callMomo<{ amount: number; transId: number }>('/v2/gateway/api/query', {
    ...body,
    lang: 'vi',
    signature: signMomo(fields),
  })
}

// IPN có chữ ký đúng mới tin (ai cũng gọi được URL IPN, chỉ MoMo biết secretKey để ký).
// Nhóm trường được ký = mọi trường MoMo gửi (trừ signature) + accessKey
export const verifyMomoIpn = ({ signature, ...rest }: MomoIpnBodyType) =>
  isSameSignature(signMomo({ accessKey: envConfig.MOMO_ACCESS_KEY!, ...rest }), signature)
