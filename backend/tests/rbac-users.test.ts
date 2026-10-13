import { beforeAll, describe, expect, it } from 'vitest'
import { Account, api, bearer, createInstructor, login, loginAdmin, PASSWORD, registerStudent, uniqueName } from './helpers'

let admin: Account

beforeAll(async () => {
  admin = await loginAdmin()
})

describe('Phân quyền', () => {
  it('chưa đăng nhập → 401, sai role → 403, admin → 200', async () => {
    const student = await registerStudent()
    await api().get('/users').expect(401)
    await api().get('/users').set(bearer(student.token)).expect(403)
    await api().get('/users').set(bearer(admin.token)).expect(200)
  })

  it('admin cấp quyền cho role mới qua API → có hiệu lực ngay, không cần đăng nhập lại', async () => {
    const user = await registerStudent()
    // Tìm permission "GET /stats/instructor"
    const perms = await api().get('/permissions?limit=100').set(bearer(admin.token)).expect(200)
    const statsPerm = perms.body.data.find((p: { method: string; path: string }) => p.method === 'GET' && p.path === '/stats/instructor')

    const role = await api()
      .post('/roles')
      .set(bearer(admin.token))
      .send({ name: uniqueName('assistant').replace(/\s/g, '_'), permissionIds: [statsPerm.id] })
      .expect(201)
    await api().put(`/users/${user.id}/role`).set(bearer(admin.token)).send({ roleId: role.body.data.id }).expect(200)

    // Vẫn token cũ: quyền đọc từ DB nên được ngay
    await api().get('/stats/instructor').set(bearer(user.token)).expect(200)
    await api().get('/courses/mine').set(bearer(user.token)).expect(403)

    // Thu hồi quyền → bị chặn ngay
    await api()
      .put(`/roles/${role.body.data.id}`)
      .set(bearer(admin.token))
      .send({ name: role.body.data.name, permissionIds: [] })
      .expect(200)
    await api().get('/stats/instructor').set(bearer(user.token)).expect(403)
  })

  it('không sửa được role ADMIN, không xóa được role hệ thống', async () => {
    const roles = await api().get('/roles?limit=100').set(bearer(admin.token)).expect(200)
    const byName = (n: string) => roles.body.data.find((r: { name: string }) => r.name === n)
    await api()
      .put(`/roles/${byName('ADMIN').id}`)
      .set(bearer(admin.token))
      .send({ name: 'ADMIN', permissionIds: [] })
      .expect(403)
    await api().delete(`/roles/${byName('STUDENT').id}`).set(bearer(admin.token)).expect(403)
  })
})

describe('Admin quản lý người dùng', () => {
  it('tìm kiếm user, không lộ mật khẩu', async () => {
    const user = await registerStudent('searchme')
    const res = await api().get(`/users?search=${encodeURIComponent(user.email)}`).set(bearer(admin.token)).expect(200)
    expect(res.body.totalItems).toBe(1)
    expect(res.body.data[0]).not.toHaveProperty('password')
  })

  it('khóa user → đăng xuất mọi nơi, mọi request bị 403; mở khóa → dùng lại được', async () => {
    const user = await registerStudent()
    await api().put(`/users/${user.id}/status`).set(bearer(admin.token)).send({ status: 'BLOCKED' }).expect(200)

    await api().get('/enrollments/mine').set(bearer(user.token)).expect(403)
    await api().post('/auth/refresh-token').send({ refreshToken: user.refreshToken }).expect(401)
    await api().post('/auth/login').send({ email: user.email, password: PASSWORD }).expect(403)

    await api().put(`/users/${user.id}/status`).set(bearer(admin.token)).send({ status: 'ACTIVE' }).expect(200)
    await login(user.email)
  })

  it('admin không tự khóa / tự đổi role của mình', async () => {
    await api().put(`/users/${admin.id}/status`).set(bearer(admin.token)).send({ status: 'BLOCKED' }).expect(403)
  })
})

describe('Hồ sơ', () => {
  it('sửa thông tin, xóa avatar bằng null', async () => {
    const user = await registerStudent()
    const updated = await api()
      .put('/profile')
      .set(bearer(user.token))
      .send({ name: 'Tên mới', phoneNumber: '0911222333', avatar: 'https://img.test/a.png' })
      .expect(200)
    expect(updated.body.data).toMatchObject({ name: 'Tên mới', avatar: 'https://img.test/a.png' })

    const cleared = await api()
      .put('/profile')
      .set(bearer(user.token))
      .send({ name: 'Tên mới', phoneNumber: '0911222333', avatar: null })
      .expect(200)
    expect(cleared.body.data.avatar).toBeNull()
  })

  it('đổi mật khẩu: thiết bị khác bị đăng xuất, thiết bị hiện tại nhận token mới', async () => {
    const user = await registerStudent()
    const otherDevice = await login(user.email)
    const newPassword = 'Changed@789'

    await api()
      .put('/profile/password')
      .set(bearer(user.token))
      .send({ currentPassword: 'sai', newPassword, confirmPassword: newPassword })
      .expect(422)
    const res = await api()
      .put('/profile/password')
      .set(bearer(user.token))
      .send({ currentPassword: PASSWORD, newPassword, confirmPassword: newPassword })
      .expect(200)

    await api().post('/auth/refresh-token').send({ refreshToken: otherDevice.refreshToken }).expect(401)
    await api().post('/auth/refresh-token').send({ refreshToken: res.body.data.refreshToken }).expect(200)
    await login(user.email, newPassword)
  })
})

describe('Thống kê', () => {
  it('admin xem thống kê toàn hệ thống, giảng viên chỉ xem của mình', async () => {
    const instructor = await createInstructor(admin)
    const adminStats = await api().get('/stats/admin').set(bearer(admin.token)).expect(200)
    expect(adminStats.body.data.users.total).toBeGreaterThan(0)
    expect(adminStats.body.data.courses.byStatus).toHaveProperty('PUBLISHED')

    await api().get('/stats/admin').set(bearer(instructor.token)).expect(403)
    const mine = await api().get('/stats/instructor').set(bearer(instructor.token)).expect(200)
    expect(mine.body.data).toMatchObject({ totalStudents: 0, courses: { total: 0 } })
  })
})
