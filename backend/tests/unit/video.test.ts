// Unit test: link HLS + chữ ký upload thẳng lên Cloudinary (hàm thuần, không gọi mạng)
import { createHash } from 'crypto'
import { v2 as cloudinary } from 'cloudinary'
import { describe, expect, it } from 'vitest'
import {
  buildHlsUrl,
  findOrphanVideos,
  HLS_EAGER,
  isSuspiciousOrphanCount,
  ORPHAN_GRACE_DAYS,
  parseCloudinaryVideoUrl,
} from '../../src/utils/video'
import { HLS_EAGER_OPTION, signVideoUpload } from '../../src/lib/cloudinary'

const CLOUD = 'democloud'
const MP4 = `https://res.cloudinary.com/${CLOUD}/video/upload/v1731400000/edu-platform/videos/abc123.mp4`

describe('parseCloudinaryVideoUrl', () => {
  it('tách publicId và version từ link gốc', () => {
    expect(parseCloudinaryVideoUrl(MP4, CLOUD)).toEqual({
      publicId: 'edu-platform/videos/abc123',
      version: '1731400000',
    })
  })
  it('link không có version', () => {
    const url = `https://res.cloudinary.com/${CLOUD}/video/upload/edu-platform/videos/abc.mov`
    expect(parseCloudinaryVideoUrl(url, CLOUD)).toEqual({ publicId: 'edu-platform/videos/abc', version: null })
  })
  it('không nhận link ngoài Cloudinary, cloud khác, ảnh, link đã có biến đổi, chuỗi không phải URL', () => {
    expect(
      parseCloudinaryVideoUrl('https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', CLOUD),
    ).toBeNull()
    expect(parseCloudinaryVideoUrl(MP4.replace(CLOUD, 'other'), CLOUD)).toBeNull()
    expect(parseCloudinaryVideoUrl(MP4.replace('/video/', '/image/'), CLOUD)).toBeNull()
    expect(parseCloudinaryVideoUrl(MP4.replace('/upload/', '/upload/w_300,c_scale/'), CLOUD)).toBeNull()
    expect(parseCloudinaryVideoUrl(MP4.replace('https:', 'http:'), CLOUD)).toBeNull()
    expect(parseCloudinaryVideoUrl('khong-phai-url', CLOUD)).toBeNull()
  })
})

describe('buildHlsUrl', () => {
  it('chèn streaming profile và đổi đuôi sang .m3u8', () => {
    expect(buildHlsUrl(MP4, CLOUD)).toBe(
      `https://res.cloudinary.com/${CLOUD}/video/upload/sp_hd/v1731400000/edu-platform/videos/abc123.m3u8`,
    )
  })
  it('không có video / chưa cấu hình Cloudinary / video ngoài → null', () => {
    expect(buildHlsUrl(null, CLOUD)).toBeNull()
    expect(buildHlsUrl(MP4, undefined)).toBeNull()
    expect(buildHlsUrl('https://example.com/a.mp4', CLOUD)).toBeNull()
  })
})

describe('Upload thẳng lên Cloudinary', () => {
  it('chuỗi eager ký cho trình duyệt giống hệt chuỗi SDK tạo ra', () => {
    // build_eager có trong SDK nhưng thiếu trong file khai báo kiểu của SDK → ép kiểu
    const { build_eager } = cloudinary.utils as unknown as { build_eager: (eager: object[]) => string }
    expect(HLS_EAGER).toBe(build_eager([HLS_EAGER_OPTION]))
  })

  it('chữ ký = SHA-1 của các tham số xếp theo tên + api_secret, ký đủ mọi field gửi kèm', () => {
    const { uploadUrl, fields } = signVideoUpload(
      { cloud_name: CLOUD, api_key: 'key123', api_secret: 'secret456' },
      1731400000,
    )
    expect(uploadUrl).toBe(`https://api.cloudinary.com/v1_1/${CLOUD}/video/upload`)

    // Cách Cloudinary kiểm tra: bỏ api_key, file, signature; còn lại xếp theo tên, nối bằng &
    const toSign =
      'allowed_formats=mp4,webm,mov&eager=sp_hd/m3u8&eager_async=true&folder=edu-platform/videos&timestamp=1731400000'
    expect(fields.signature).toBe(
      createHash('sha1')
        .update(toSign + 'secret456')
        .digest('hex'),
    )
    expect(fields).toMatchObject({ api_key: 'key123', timestamp: 1731400000, folder: 'edu-platform/videos' })
    // api_secret tuyệt đối không được nằm trong dữ liệu trả cho trình duyệt
    expect(JSON.stringify(fields)).not.toContain('secret456')
  })
})

describe('dọn video thừa', () => {
  const NOW = new Date('2026-11-21T00:00:00Z')
  const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000)
  const asset = (publicId: string, ageDays: number) => ({ publicId, createdAt: daysAgo(ageDays), bytes: 1000 })

  it('chỉ chọn video không bài nào dùng VÀ đã quá thời gian chờ', () => {
    const assets = [
      asset('edu-platform/videos/dang-dung', 90), // bài giảng còn dùng → giữ
      asset('edu-platform/videos/thua-cu', ORPHAN_GRACE_DAYS + 1), // thừa, đủ lâu → xóa
      asset('edu-platform/videos/vua-upload', 2), // thừa nhưng mới upload (chưa bấm Lưu bài) → giữ
    ]
    const orphans = findOrphanVideos(assets, new Set(['edu-platform/videos/dang-dung']), NOW)
    expect(orphans.map((a) => a.publicId)).toEqual(['edu-platform/videos/thua-cu'])
  })

  it('phanh an toàn: quá nửa số video là thừa thì coi là bất thường', () => {
    expect(isSuspiciousOrphanCount(6, 10)).toBe(true)
    expect(isSuspiciousOrphanCount(5, 10)).toBe(false)
    // Ít video: 2/3 thừa vẫn là chuyện bình thường (vừa dọn khóa test chẳng hạn)
    expect(isSuspiciousOrphanCount(2, 3)).toBe(false)
  })
})
