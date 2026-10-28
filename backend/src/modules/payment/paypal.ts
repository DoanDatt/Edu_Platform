import envConfig from '../../config/env'
import { HttpError } from '../../utils/error'

// Tài liệu: developer.paypal.com/docs/api/orders/v2 (tạo order → người mua duyệt trên PayPal → server capture)

export const isPaypalEnabled = () => Boolean(envConfig.PAYPAL_CLIENT_ID && envConfig.PAYPAL_CLIENT_SECRET)

// PayPal không có VND → đổi sang USD, làm tròn LÊN tới cent (không thu thiếu), tối thiểu 0.01
export const vndToUsd = (amount: number) =>
  (Math.max(1, Math.ceil((amount * 100) / envConfig.PAYPAL_VND_PER_USD)) / 100).toFixed(2)

// Access token sống ~9 tiếng → giữ lại dùng tiếp, gần hết hạn mới xin cái mới
let cachedToken: { value: string; expiresAt: number } | undefined

const getAccessToken = async () => {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value

  const basic = Buffer.from(`${envConfig.PAYPAL_CLIENT_ID}:${envConfig.PAYPAL_CLIENT_SECRET}`).toString('base64')
  const res = await fetch(`${envConfig.PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) {
    throw new HttpError(502, 'Không kết nối được PayPal (sai Client ID / Secret?)')
  }
  const data = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  return cachedToken.value
}

// body có → POST, không có → GET
const callPaypal = async <T>(path: string, body?: unknown) => {
  const res = await fetch(`${envConfig.PAYPAL_API}${path}`, {
    headers: { Authorization: `Bearer ${await getAccessToken()}`, 'Content-Type': 'application/json' },
    ...(body === undefined ? { method: 'GET' } : { method: 'POST', body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(30_000),
  })
  const data = (await res.json().catch(() => ({}))) as T & { message?: string }
  if (!res.ok) {
    throw new HttpError(502, `PayPal báo lỗi: ${data.message ?? res.status}`)
  }
  return data
}

type CreatePaypalOrderInput = {
  orderCode: string
  amount: number // VND
  description: string
  returnUrl: string // duyệt xong PayPal đưa người mua về đây (gắn thêm ?token=<paypal order id>)
  cancelUrl: string
}

// Tạo order bên PayPal → trả về id (lưu lại để capture) + link cho người mua bấm vào duyệt
export const createPaypalOrder = async ({
  orderCode,
  amount,
  description,
  returnUrl,
  cancelUrl,
}: CreatePaypalOrderInput) => {
  const order = await callPaypal<{ id: string; links: { rel: string; href: string }[] }>('/v2/checkout/orders', {
    intent: 'CAPTURE',
    purchase_units: [
      {
        // custom_id: mã đơn của mình, PayPal trả lại khi capture → đối chiếu đúng đơn
        custom_id: orderCode,
        description: description.slice(0, 127),
        amount: { currency_code: 'USD', value: vndToUsd(amount) },
      },
    ],
    payment_source: {
      paypal: {
        experience_context: {
          brand_name: 'Edu Platform',
          shipping_preference: 'NO_SHIPPING', // khóa học không cần địa chỉ giao hàng
          user_action: 'PAY_NOW',
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      },
    },
  })
  const approveUrl = order.links.find((link) => link.rel === 'payer-action' || link.rel === 'approve')?.href
  if (!approveUrl) {
    throw new HttpError(502, 'PayPal không trả về link thanh toán')
  }
  return { paypalOrderId: order.id, approveUrl }
}

type PaypalCapture = {
  id: string
  status: string
  custom_id?: string
  amount: { currency_code: string; value: string }
}
type PaypalOrder = {
  id: string
  status: string // CREATED → APPROVED (người mua đã duyệt) → COMPLETED (đã capture, tiền về)
  purchase_units: { payments?: { captures?: PaypalCapture[] } }[]
}

// Người mua đã duyệt thì capture (thu tiền). Capture rồi thì đọc lại kết quả (gọi lại nhiều lần vẫn an toàn).
// Trả về giao dịch đã thu thành công, hoặc undefined nếu người mua chưa duyệt / bỏ ngang
export const capturePaypalOrder = async (paypalOrderId: string) => {
  let order = await callPaypal<PaypalOrder>(`/v2/checkout/orders/${paypalOrderId}`)
  if (order.status === 'APPROVED') {
    order = await callPaypal<PaypalOrder>(`/v2/checkout/orders/${paypalOrderId}/capture`, {})
  }
  if (order.status !== 'COMPLETED') return undefined
  return order.purchase_units[0]?.payments?.captures?.find((capture) => capture.status === 'COMPLETED')
}
