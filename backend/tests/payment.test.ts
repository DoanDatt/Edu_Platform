import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { signMomo } from '../src/modules/payment/momo'
import {
  Account,
  api,
  bearer,
  createCategory,
  createInstructor,
  createPublishedCourse,
  loginAdmin,
  registerStudent,
} from './helpers'

const PRICE = 199_000

let courseId: number
let cheapCourseId: number

// Giả lập server MoMo / PayPal: test không bao giờ gọi cổng thật. Ghi lại request để kiểm tra dữ liệu gửi đi
const sentRequests: { url: string; method: string; body: unknown }[] = []
let paypalStatus = 'APPROVED'

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

const fakeGateway = async (input: string | URL | Request, init?: RequestInit) => {
  const url = String(input)
  const method = init?.method ?? 'GET'
  const body = typeof init?.body === 'string' && init.body.startsWith('{') ? JSON.parse(init.body) : init?.body
  sentRequests.push({ url, method, body })

  if (url.endsWith('/v2/gateway/api/create')) {
    return json({ resultCode: 0, message: 'Thành công', payUrl: 'https://momo.test/pay' })
  }
  if (url.endsWith('/v2/gateway/api/query')) {
    return json({ resultCode: 0, message: 'Thành công', amount: PRICE, transId: 4_100_000_001 })
  }
  if (url.endsWith('/v1/oauth2/token')) {
    return json({ access_token: 'paypal-token', expires_in: 32_400 })
  }
  if (url.endsWith('/v2/checkout/orders') && method === 'POST') {
    return json({ id: 'PAYPAL-ORDER-1', links: [{ rel: 'payer-action', href: 'https://paypal.test/approve' }] }, 201)
  }
  if (url.endsWith('/v2/checkout/orders/PAYPAL-ORDER-1/capture')) {
    paypalStatus = 'COMPLETED'
  }
  if (url.includes('/v2/checkout/orders/PAYPAL-ORDER-1')) {
    const captures =
      paypalStatus === 'COMPLETED'
        ? [{ id: 'CAPTURE-1', status: 'COMPLETED', amount: { currency_code: 'USD', value: '7.96' } }]
        : []
    return json({ id: 'PAYPAL-ORDER-1', status: paypalStatus, purchase_units: [{ payments: { captures } }] })
  }
  return json({ message: 'not found' }, 404)
}

beforeAll(async () => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(fakeGateway)
  const admin = await loginAdmin()
  const instructor = await createInstructor(admin)
  const categoryId = await createCategory(admin)
  courseId = (await createPublishedCourse(instructor, admin, { price: PRICE, categoryId })).courseId
  cheapCourseId = (await createPublishedCourse(instructor, admin, { price: 5_000, categoryId })).courseId
})

afterAll(() => {
  vi.restoreAllMocks()
})

// Mỗi kịch bản 1 học viên mới (mua xong là đã ghi danh, không mua lại được)
const newOrder = async () => {
  const student = await registerStudent('buyer')
  const res = await api().post('/orders').set(bearer(student.token)).send({ courseId }).expect(201)
  return { student, orderId: res.body.data.id as number, code: res.body.data.code as string }
}

const getOrder = async (student: Account, orderId: number) =>
  (await api().get(`/orders/${orderId}`).set(bearer(student.token)).expect(200)).body.data

describe('Chọn cổng thanh toán', () => {
  it('liệt kê các cổng đã cấu hình', async () => {
    const res = await api().get('/payments/methods').expect(200)
    expect(res.body.data).toEqual(['MOMO', 'PAYPAL', 'SEPAY'])
  })

  it('sai cổng → 422; đơn của người khác → 404', async () => {
    const { orderId, student } = await newOrder()
    await api().post(`/orders/${orderId}/pay`).set(bearer(student.token)).send({ method: 'VISA' }).expect(422)
    const other = await registerStudent('other')
    await api().post(`/orders/${orderId}/pay`).set(bearer(other.token)).send({ method: 'SEPAY' }).expect(404)
  })

  it('đơn dưới 10.000 đ không trả bằng MoMo được', async () => {
    const student = await registerStudent('buyer')
    const order = await api().post('/orders').set(bearer(student.token)).send({ courseId: cheapCourseId }).expect(201)
    const res = await api()
      .post(`/orders/${order.body.data.id}/pay`)
      .set(bearer(student.token))
      .send({ method: 'MOMO' })
      .expect(400)
    expect(res.body.message).toContain('10.000')
  })
})

describe('MoMo', () => {
  const ipnBody = (momoOrderId: string, resultCode = 0) => {
    const fields = {
      partnerCode: 'MOMO',
      orderId: momoOrderId,
      requestId: 'req-1',
      amount: PRICE,
      orderInfo: 'Thanh toan',
      orderType: 'momo_wallet',
      transId: 4_100_000_002,
      resultCode,
      message: 'Thành công.',
      payType: 'napas',
      responseTime: Date.now(),
      extraData: '',
    }
    return { ...fields, signature: signMomo({ accessKey: 'F8BBA842ECF85', ...fields }) }
  }

  it('tạo giao dịch có chữ ký đúng, IPN giả chữ ký bị chặn, IPN thật → đơn PAID', async () => {
    const { student, orderId, code } = await newOrder()
    const res = await api()
      .post(`/orders/${orderId}/pay`)
      .set(bearer(student.token))
      .send({ method: 'MOMO' })
      .expect(200)
    expect(res.body.data).toEqual({ method: 'MOMO', payUrl: 'https://momo.test/pay' })

    // Chữ ký gửi MoMo = HMAC của đúng nhóm trường quy định
    const sent = sentRequests.findLast((r) => r.url.endsWith('/create'))!.body as Record<string, string | number>
    expect(sent.orderId).toMatch(new RegExp(`^${code}_\\d+$`))
    expect(sent.amount).toBe(PRICE)
    const { signature, lang: _lang, ...signed } = sent
    expect(signature).toBe(signMomo({ accessKey: 'F8BBA842ECF85', ...signed }))

    const momoOrderId = sent.orderId as string
    const forged = { ...ipnBody(momoOrderId), amount: 1 } // sửa số tiền → chữ ký không còn khớp
    await api().post('/payments/momo/ipn').send(forged).expect(400)
    expect((await getOrder(student, orderId)).status).toBe('PENDING')

    await api().post('/payments/momo/ipn').send(ipnBody(momoOrderId)).expect(204)
    // MoMo gửi lại IPN → vẫn 204, không xử lý lại
    await api().post('/payments/momo/ipn').send(ipnBody(momoOrderId)).expect(204)
    const paid = await getOrder(student, orderId)
    expect(paid).toMatchObject({ status: 'PAID', method: 'MOMO' })
    await api().get(`/enrollments/mine/${courseId}`).set(bearer(student.token)).expect(200)
  })

  it('IPN báo thất bại thì đơn vẫn chờ', async () => {
    const { student, orderId, code } = await newOrder()
    await api()
      .post('/payments/momo/ipn')
      .send(ipnBody(`${code}_1`, 1006))
      .expect(204)
    expect((await getOrder(student, orderId)).status).toBe('PENDING')
  })

  it('không nhận được IPN (máy local) → trang kết quả hỏi MoMo và chốt đơn', async () => {
    const { student, orderId } = await newOrder()
    await api().post(`/orders/${orderId}/pay`).set(bearer(student.token)).send({ method: 'MOMO' }).expect(200)
    const res = await api().post(`/orders/${orderId}/confirm`).set(bearer(student.token)).expect(200)
    expect(res.body.data).toMatchObject({ status: 'PAID', method: 'MOMO' })

    // Đã trả rồi thì không cho bấm thanh toán nữa
    await api().post(`/orders/${orderId}/pay`).set(bearer(student.token)).send({ method: 'MOMO' }).expect(409)
  })
})

describe('PayPal', () => {
  it('tạo order bằng USD, người mua duyệt xong → capture → đơn PAID', async () => {
    const { student, orderId, code } = await newOrder()
    const res = await api()
      .post(`/orders/${orderId}/pay`)
      .set(bearer(student.token))
      .send({ method: 'PAYPAL' })
      .expect(200)
    expect(res.body.data).toEqual({ method: 'PAYPAL', payUrl: 'https://paypal.test/approve' })

    // 199.000 đ / 25.000 = 7,96 USD, custom_id = mã đơn
    const sent = sentRequests.findLast((r) => r.url.endsWith('/v2/checkout/orders'))!.body as {
      purchase_units: { custom_id: string; amount: { currency_code: string; value: string } }[]
    }
    expect(sent.purchase_units[0]).toMatchObject({ custom_id: code, amount: { currency_code: 'USD', value: '7.96' } })

    const confirmed = await api().post(`/orders/${orderId}/confirm`).set(bearer(student.token)).expect(200)
    expect(confirmed.body.data).toMatchObject({ status: 'PAID', method: 'PAYPAL' })
  })
})

describe('SePay', () => {
  const webhook = (id: number, content: string, transferAmount = PRICE) => ({
    id,
    gateway: 'MBBank',
    transactionDate: '2026-10-28 10:00:00',
    accountNumber: '0123456789',
    code: null,
    content,
    transferType: 'in',
    transferAmount,
    accumulated: 10_000_000,
    referenceCode: `FT${id}`,
    description: content,
  })
  const sepayAuth = { Authorization: 'Apikey test-sepay-key' }

  it('trả thông tin chuyển khoản + QR với nội dung là mã đơn', async () => {
    const { student, orderId, code } = await newOrder()
    const res = await api()
      .post(`/orders/${orderId}/pay`)
      .set(bearer(student.token))
      .send({ method: 'SEPAY' })
      .expect(200)
    expect(res.body.data.transfer).toMatchObject({ accountNumber: '0123456789', amount: PRICE, content: code })
    expect(res.body.data.transfer.qrUrl).toContain(`des=${code}`)
  })

  it('sai API key → 401; chuyển thiếu không xác nhận; chuyển đủ → PAID; gửi lại cùng id không xử lý lại', async () => {
    const { student, orderId, code } = await newOrder()
    const id = Date.now()
    // Ngân hàng chèn thêm chữ quanh nội dung
    const content = `MBVCB.123.${code}.CT tu 0123 NGUYEN VAN A`

    await api().post('/payments/sepay/webhook').send(webhook(id, content)).expect(401)
    await api()
      .post('/payments/sepay/webhook')
      .set({ Authorization: 'Apikey wrong' })
      .send(webhook(id, content))
      .expect(401)

    const short = await api()
      .post('/payments/sepay/webhook')
      .set(sepayAuth)
      .send(webhook(id, content, 1_000))
      .expect(200)
    expect(short.body).toEqual({ success: true })
    expect((await getOrder(student, orderId)).status).toBe('PENDING')

    await api()
      .post('/payments/sepay/webhook')
      .set(sepayAuth)
      .send(webhook(id + 1, content))
      .expect(200)
    await api()
      .post('/payments/sepay/webhook')
      .set(sepayAuth)
      .send(webhook(id + 1, content))
      .expect(200)
    expect(await getOrder(student, orderId)).toMatchObject({ status: 'PAID', method: 'SEPAY' })
  })

  it('nội dung không có mã đơn → vẫn trả success (lưu log để xử lý tay)', async () => {
    const res = await api()
      .post('/payments/sepay/webhook')
      .set(sepayAuth)
      .send(webhook(Date.now() + 99, 'chuyen tien an trua'))
      .expect(200)
    expect(res.body).toEqual({ success: true })
  })
})
