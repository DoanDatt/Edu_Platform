// Unit test: hàm thuần, không cần DB / HTTP
import { describe, expect, it } from 'vitest'
import { buildPermissionPath } from '../../src/utils/permission-path'
import { hasExactlyIds } from '../../src/utils/ids'
import { generateOtp, hashOtp, isOtpMatch } from '../../src/utils/crypto'
import { courseRejectedEmail, welcomeEmail } from '../../src/emails/templates'

describe('buildPermissionPath', () => {
  it('ghép prefix với path của route', () => {
    expect(buildPermissionPath('/roles', '/:roleId')).toBe('/roles/:roleId')
  })
  it('bỏ dấu / ở cuối để khớp với path lưu trong DB', () => {
    expect(buildPermissionPath('/roles', '/')).toBe('/roles')
  })
  it('giữ nguyên "/" khi chỉ có "/"', () => {
    expect(buildPermissionPath('', '/')).toBe('/')
  })
})

describe('hasExactlyIds', () => {
  it('đúng khi đủ id, chỉ khác thứ tự', () => {
    expect(hasExactlyIds([3, 1, 2], [1, 2, 3])).toBe(true)
  })
  it('sai khi thiếu, thừa hoặc trùng id', () => {
    expect(hasExactlyIds([1, 2], [1, 2, 3])).toBe(false)
    expect(hasExactlyIds([1, 2, 3, 4], [1, 2, 3])).toBe(false)
    expect(hasExactlyIds([1, 1, 2], [1, 2, 3])).toBe(false)
  })
})

describe('OTP', () => {
  it('luôn gồm đúng 6 chữ số (kể cả số có 0 ở đầu)', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateOtp()).toMatch(/^\d{6}$/)
    }
  })
  it('lưu dạng hash và so khớp được', () => {
    const code = '012345'
    const hash = hashOtp(code)
    expect(hash).toHaveLength(64)
    expect(hash).not.toContain(code)
    expect(isOtpMatch(code, hash)).toBe(true)
    expect(isOtpMatch('012346', hash)).toBe(false)
  })
})

describe('email templates', () => {
  it('escape dữ liệu người dùng nhập trong HTML', () => {
    const { html, text } = welcomeEmail('<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    // Bản text thuần thì giữ nguyên (không phải HTML)
    expect(text).toContain('<script>')
  })
  it('email gỡ khóa và từ chối có nội dung khác nhau', () => {
    expect(courseRejectedEmail('An', 'React', 'x', true).subject).toContain('gỡ')
    expect(courseRejectedEmail('An', 'React', 'x', false).subject).toContain('chưa được duyệt')
  })
})
