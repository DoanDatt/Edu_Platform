// Unit test gửi email qua Brevo: giả lập fetch, không gửi email thật
import { UnrecoverableError } from 'bullmq'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mail = { to: 'hocvien@edu.local', subject: 'Mã OTP', html: '<b>123456</b>', text: '123456' }

// envConfig đọc biến môi trường lúc import → đặt biến xong mới import lại mailer
const loadMailer = async () => {
  vi.resetModules()
  return import('../../src/lib/mailer.js')
}

describe('mailer', () => {
  beforeEach(() => {
    vi.stubEnv('BREVO_API_KEY', 'test-key')
    vi.stubEnv('MAIL_FROM', 'Edu Platform <ban@gmail.com>')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('không có BREVO_API_KEY thì dùng SMTP', async () => {
    vi.stubEnv('BREVO_API_KEY', '')
    expect((await loadMailer()).mailProvider).toBe('smtp')
  })

  it('có BREVO_API_KEY thì gọi API Brevo, tách tên + email người gửi từ MAIL_FROM', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ messageId: '<abc>' }), { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)
    const { mailProvider, sendMail } = await loadMailer()

    expect(mailProvider).toBe('brevo')
    expect(await sendMail(mail)).toEqual({ messageId: '<abc>' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.brevo.com/v3/smtp/email')
    expect(init.headers['api-key']).toBe('test-key')
    expect(JSON.parse(init.body)).toEqual({
      sender: { name: 'Edu Platform', email: 'ban@gmail.com' },
      to: [{ email: mail.to }],
      subject: mail.subject,
      htmlContent: mail.html,
      textContent: mail.text,
    })
  })

  it('Brevo trả 4xx (sai key, người gửi chưa xác minh) thì dừng hẳn, không thử lại', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Key not found' }), { status: 401 })))
    const { sendMail } = await loadMailer()
    await expect(sendMail(mail)).rejects.toBeInstanceOf(UnrecoverableError)
  })

  it('Brevo trả 429 / 5xx thì ném lỗi thường để BullMQ thử lại', async () => {
    for (const status of [429, 503]) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status })))
      const { sendMail } = await loadMailer()
      const error = await sendMail(mail).catch((e: unknown) => e)
      expect(error).toBeInstanceOf(Error)
      expect(error).not.toBeInstanceOf(UnrecoverableError)
    }
  })
})
