import { timingSafeEqual } from 'crypto'
import envConfig from '../../config/env'

// Tài liệu: docs.sepay.vn (Tích hợp webhooks, Tạo QR code VietQR động)

export const isSepayEnabled = () =>
  Boolean(envConfig.SEPAY_API_KEY && envConfig.SEPAY_BANK && envConfig.SEPAY_ACCOUNT_NUMBER)

// Thông tin chuyển khoản hiện ở trang thanh toán. Nội dung chuyển khoản = mã đơn → SePay báo về là biết đơn nào
export const getSepayTransferInfo = (orderCode: string, amount: number) => {
  const params = new URLSearchParams({
    acc: envConfig.SEPAY_ACCOUNT_NUMBER!,
    bank: envConfig.SEPAY_BANK!,
    amount: String(amount),
    des: orderCode,
    template: 'compact',
  })
  return {
    bank: envConfig.SEPAY_BANK!,
    accountNumber: envConfig.SEPAY_ACCOUNT_NUMBER!,
    accountName: envConfig.SEPAY_ACCOUNT_NAME ?? null,
    amount,
    content: orderCode,
    // Ảnh VietQR: quét bằng app ngân hàng là điền sẵn số tài khoản, số tiền, nội dung
    qrUrl: `https://vietqr.app/img?${params}`,
  }
}

// Webhook cấu hình kiểu "API Key" → SePay gửi header Authorization: Apikey <key>
export const isValidSepayAuth = (header: string | undefined) => {
  const expected = Buffer.from(`Apikey ${envConfig.SEPAY_API_KEY}`)
  const received = Buffer.from(header ?? '')
  return expected.length === received.length && timingSafeEqual(expected, received)
}

// Tìm mã đơn trong giao dịch. SePay tự tách mã thanh toán vào trường code (nếu cấu hình tiền tố trên my.sepay.vn);
// không có thì tự tìm trong nội dung. Ngân hàng hay chèn thêm chữ vào nội dung (vd "MBVCB.123.EDUAB12CD34.CT tu ...")
export const findOrderCode = (code: string | null | undefined, content: string) => {
  const pattern = new RegExp(`${envConfig.PAYMENT_CODE_PREFIX}[A-Z0-9]{8}`)
  return (code ?? '').toUpperCase().match(pattern)?.[0] ?? content.toUpperCase().match(pattern)?.[0]
}
