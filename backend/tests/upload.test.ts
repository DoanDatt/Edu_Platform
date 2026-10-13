import { beforeAll, describe, expect, it } from 'vitest'
import { Account, api, bearer, createInstructor, loginAdmin, registerStudent } from './helpers'

// PNG 1x1 thật (đúng chữ ký file)
const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f80f0000010100051' +
    '8d84e0000000049454e44ae426082',
  'hex',
)
// MP4 tối giản: 4 byte độ dài + "ftyp"
const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypmp42'), Buffer.alloc(64)])

let admin: Account
let student: Account
let instructor: Account

beforeAll(async () => {
  admin = await loginAdmin()
  student = await registerStudent()
  instructor = await createInstructor(admin)
})

describe('Upload', () => {
  it('ảnh hợp lệ → 201 và tải lại được qua url', async () => {
    const res = await api()
      .post('/uploads/image')
      .set(bearer(student.token))
      .attach('file', PNG, { filename: 'a.png', contentType: 'image/png' })
      .expect(201)
    expect(res.body.data).toMatchObject({ mimeType: 'image/png', size: PNG.length })

    const path = new URL(res.body.data.url).pathname
    const file = await api().get(path).expect(200)
    expect(file.headers['content-type']).toBe('image/png')
  })

  it('đổi đuôi file không qua được kiểm tra chữ ký → 422', async () => {
    await api()
      .post('/uploads/image')
      .set(bearer(student.token))
      .attach('file', Buffer.from('khong phai anh'), { filename: 'fake.jpg', contentType: 'image/jpeg' })
      .expect(422)
  })

  it('sai loại, không có file, chưa đăng nhập', async () => {
    await api()
      .post('/uploads/image')
      .set(bearer(student.token))
      .attach('file', Buffer.from('x'), { filename: 'a.txt', contentType: 'text/plain' })
      .expect(422)
    await api().post('/uploads/image').set(bearer(student.token)).field('other', 'x').expect(422)
    await api().post('/uploads/image').attach('file', PNG, { filename: 'a.png', contentType: 'image/png' }).expect(401)
  })

  it('video: học viên 403, giảng viên 201', async () => {
    await api()
      .post('/uploads/video')
      .set(bearer(student.token))
      .attach('file', MP4, { filename: 'v.mp4', contentType: 'video/mp4' })
      .expect(403)
    const res = await api()
      .post('/uploads/video')
      .set(bearer(instructor.token))
      .attach('file', MP4, { filename: 'v.mp4', contentType: 'video/mp4' })
      .expect(201)
    expect(res.body.data.url).toMatch(/\/uploads\/videos\/.+\.mp4$/)
  })

  it('file không tồn tại → 404', async () => {
    await api().get('/uploads/images/khong-co.png').expect(404)
  })
})
