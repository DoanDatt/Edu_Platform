import { describe, expect, it } from 'vitest'
import { api, bearer, lastEmailTo, login, PASSWORD, registerStudent, uniqueEmail } from './helpers'

describe('Đăng ký / đăng nhập', () => {
  it('đăng ký tạo STUDENT, trả token và gửi email chào mừng', async () => {
    const email = uniqueEmail()
    const res = await api()
      .post('/auth/register')
      .send({ email, password: PASSWORD, confirmPassword: PASSWORD, name: 'An', phoneNumber: '0900000000' })
      .expect(201)

    expect(res.body.data).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      account: { email, name: 'An', role: 'STUDENT' },
    })
    expect(res.body.data.account).not.toHaveProperty('password')
    expect(lastEmailTo(email)?.subject).toContain('Chào mừng')
  })

  it('email đã dùng → 409', async () => {
    const { email } = await registerStudent()
    await api()
      .post('/auth/register')
      .send({ email, password: PASSWORD, confirmPassword: PASSWORD, name: 'An', phoneNumber: '0900000000' })
      .expect(409)
  })

  it('dữ liệu sai → 422 kèm lỗi từng field', async () => {
    const res = await api()
      .post('/auth/register')
      .send({ email: 'khong-phai-email', password: '123', confirmPassword: '456', name: '', phoneNumber: '1' })
      .expect(422)
    const fields = res.body.errors.map((e: { field: string }) => e.field)
    expect(fields).toEqual(expect.arrayContaining(['email', 'password', 'name', 'phoneNumber']))
  })

  it('gửi thừa field → 422 (strict)', async () => {
    await api()
      .post('/auth/login')
      .send({ email: uniqueEmail(), password: PASSWORD, role: 'ADMIN' })
      .expect(422)
  })

  it('sai mật khẩu và email không tồn tại trả cùng 1 lỗi 401', async () => {
    const { email } = await registerStudent()
    const wrongPassword = await api().post('/auth/login').send({ email, password: 'sai-mat-khau' }).expect(401)
    const noUser = await api().post('/auth/login').send({ email: uniqueEmail(), password: PASSWORD }).expect(401)
    expect(wrongPassword.body.message).toBe(noUser.body.message)
  })

  it('GET /auth/me cần token hợp lệ', async () => {
    const user = await registerStudent()
    await api().get('/auth/me').expect(401)
    await api().get('/auth/me').set(bearer('token-sai')).expect(401)
    const res = await api().get('/auth/me').set(bearer(user.token)).expect(200)
    expect(res.body.data).toMatchObject({ id: user.id, email: user.email, role: { name: 'STUDENT' } })
  })
})

describe('Refresh token', () => {
  it('xoay vòng: token cũ chỉ dùng được 1 lần', async () => {
    const user = await registerStudent()
    const first = await api().post('/auth/refresh-token').send({ refreshToken: user.refreshToken }).expect(200)
    expect(first.body.data.refreshToken).not.toBe(user.refreshToken)

    // Dùng lại token cũ → bị từ chối
    await api().post('/auth/refresh-token').send({ refreshToken: user.refreshToken }).expect(401)
    // Token mới vẫn dùng được
    await api().post('/auth/refresh-token').send({ refreshToken: first.body.data.refreshToken }).expect(200)
  })

  it('2 request refresh cùng lúc bằng 1 token → chỉ 1 cái thành công', async () => {
    const user = await registerStudent()
    const results = await Promise.all([
      api().post('/auth/refresh-token').send({ refreshToken: user.refreshToken }),
      api().post('/auth/refresh-token').send({ refreshToken: user.refreshToken }),
    ])
    expect(results.map((r) => r.status).sort()).toEqual([200, 401])
  })

  it('logout thu hồi refresh token', async () => {
    const user = await registerStudent()
    await api().post('/auth/logout').send({ refreshToken: user.refreshToken }).expect(200)
    await api().post('/auth/refresh-token').send({ refreshToken: user.refreshToken }).expect(401)
    await api().post('/auth/logout').send({ refreshToken: user.refreshToken }).expect(401)
  })
})

describe('Quên mật khẩu', () => {
  const otpOf = (email: string) => lastEmailTo(email)?.subject.match(/(\d{6})/)?.[1]

  it('email không tồn tại vẫn trả 200 như bình thường, không gửi email', async () => {
    const email = uniqueEmail('nobody')
    await api().post('/auth/forgot-password').send({ email }).expect(200)
    expect(lastEmailTo(email)).toBeUndefined()
  })

  it('đặt lại mật khẩu bằng OTP, đăng xuất mọi thiết bị', async () => {
    const user = await registerStudent()
    await api().post('/auth/forgot-password').send({ email: user.email }).expect(200)
    const code = otpOf(user.email)
    expect(code).toMatch(/^\d{6}$/)

    const newPassword = 'NewPassword@456'
    await api()
      .post('/auth/reset-password')
      .send({ email: user.email, code, newPassword, confirmPassword: newPassword })
      .expect(200)

    // Phiên cũ bị thu hồi, mật khẩu cũ hết dùng được, mật khẩu mới đăng nhập được
    await api().post('/auth/refresh-token').send({ refreshToken: user.refreshToken }).expect(401)
    await api().post('/auth/login').send({ email: user.email, password: PASSWORD }).expect(401)
    await login(user.email, newPassword)
    // Mã chỉ dùng 1 lần
    await api()
      .post('/auth/reset-password')
      .send({ email: user.email, code, newPassword: 'Other@12345', confirmPassword: 'Other@12345' })
      .expect(422)
    expect(lastEmailTo(user.email)?.subject).toContain('thay đổi')
  })

  it('nhập sai 5 lần thì mã bị hủy, nhập đúng cũng không được', async () => {
    const user = await registerStudent()
    await api().post('/auth/forgot-password').send({ email: user.email }).expect(200)
    const code = otpOf(user.email)!
    const wrong = String((Number(code) + 1) % 1_000_000).padStart(6, '0')
    const body = (c: string) => ({ email: user.email, code: c, newPassword: 'Xyz@12345', confirmPassword: 'Xyz@12345' })

    for (let i = 0; i < 5; i++) {
      await api().post('/auth/reset-password').send(body(wrong)).expect(422)
    }
    await api().post('/auth/reset-password').send(body(code)).expect(422)
  })

  it('verify-otp: mã đúng thì 200, mã vẫn dùng tiếp được để đặt lại mật khẩu', async () => {
    const user = await registerStudent()
    await api().post('/auth/forgot-password').send({ email: user.email }).expect(200)
    const code = otpOf(user.email)!
    const wrong = String((Number(code) + 1) % 1_000_000).padStart(6, '0')

    await api().post('/auth/verify-otp').send({ email: user.email, code: wrong }).expect(422)
    await api().post('/auth/verify-otp').send({ email: user.email, code }).expect(200)
    // Kiểm tra mã không xóa mã: bước đổi mật khẩu vẫn dùng đúng mã đó
    await api()
      .post('/auth/reset-password')
      .send({ email: user.email, code, newPassword: 'Xyz@12345', confirmPassword: 'Xyz@12345' })
      .expect(200)
    await api().post('/auth/verify-otp').send({ email: user.email, code }).expect(422)
  })

  it('verify-otp: lần sai được cộng dồn, đủ 5 lần thì mã bị hủy', async () => {
    const user = await registerStudent()
    await api().post('/auth/forgot-password').send({ email: user.email }).expect(200)
    const code = otpOf(user.email)!
    const wrong = String((Number(code) + 1) % 1_000_000).padStart(6, '0')

    for (let i = 0; i < 5; i++) {
      await api().post('/auth/verify-otp').send({ email: user.email, code: wrong }).expect(422)
    }
    await api().post('/auth/verify-otp').send({ email: user.email, code }).expect(422)
  })

  it('xin lại mã trong 60 giây thì không gửi email mới', async () => {
    const user = await registerStudent()
    await api().post('/auth/forgot-password').send({ email: user.email }).expect(200)
    await api().post('/auth/forgot-password').send({ email: user.email }).expect(200)
    const otpEmails = globalThis.sentEmails.filter((e) => e.to === user.email && /\d{6}/.test(e.subject))
    expect(otpEmails).toHaveLength(1)
  })
})
