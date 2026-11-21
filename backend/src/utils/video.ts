// Xử lý link video Cloudinary (hàm thuần, không gọi mạng → unit test được)

// Streaming profile dựng sẵn của Cloudinary dùng cho HLS: "hd" = nhiều mức chất lượng, cao nhất 720p.
// Không dùng "full_hd" / "auto": thêm bản 1080p tốn thêm credit gói free mà video bài giảng không cần
export const HLS_STREAMING_PROFILE = 'hd'

// Tạo sẵn bản HLS ngay lúc upload (chạy nền ở Cloudinary). Gói free chỉ tạo "lúc phát" (on-the-fly)
// được cho video dưới 40MB → video lớn hơn bắt buộc phải tạo trước như thế này.
// Chuỗi này phải giống hệt cách SDK ghép: cloudinary.utils.build_eager([{ streaming_profile: 'hd', format: 'm3u8' }])
export const HLS_EAGER = `sp_${HLS_STREAMING_PROFILE}/m3u8`

// Link video gốc Cloudinary trả về sau khi upload:
//   https://res.cloudinary.com/<cloud>/video/upload/v1731400000/edu-platform/videos/abc.mp4
// → tách được publicId "edu-platform/videos/abc", version "1731400000"
// Link không phải của Cloudinary (seed dùng mp4 của MDN, link tự dán) hoặc của cloud khác → null
export const parseCloudinaryVideoUrl = (videoUrl: string, cloudName: string) => {
  let url: URL
  try {
    url = new URL(videoUrl)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com') return null

  const prefix = `/${cloudName}/video/upload/`
  if (!url.pathname.startsWith(prefix)) return null

  // Chỉ nhận link gốc (có thể có version), không nhận link đã gắn sẵn biến đổi (w_300, sp_hd...)
  const match = url.pathname.slice(prefix.length).match(/^(?:v(\d+)\/)?([\w\-/]+)\.(\w+)$/)
  if (!match) return null
  const [, version, publicId] = match
  return { publicId, version: version ?? null }
}

// ===== Dọn video thừa trên Cloudinary =====

// Video phải "không ai dùng" ít nhất chừng này ngày mới bị xóa:
//   - vừa upload nhưng giảng viên chưa bấm Lưu bài → chưa có bài nào trỏ tới, không được xóa vội
//   - bài đã xóa mềm vẫn khôi phục được → giữ video thêm 30 ngày
export const ORPHAN_GRACE_DAYS = 30
// Phanh an toàn: thấy hơn chừng này phần video là "thừa" thì gần như chắc chắn đang so với NHẦM database
// (vd máy local dùng chung cloud với production) → không xóa gì
export const MAX_ORPHAN_RATIO = 0.5

export type CloudVideoAsset = { publicId: string; createdAt: Date; bytes: number }

// Chọn video thừa: không bài giảng nào dùng VÀ đã upload quá ORPHAN_GRACE_DAYS ngày
export const findOrphanVideos = (assets: CloudVideoAsset[], referencedPublicIds: Set<string>, now = new Date()) => {
  const cutoff = now.getTime() - ORPHAN_GRACE_DAYS * 24 * 60 * 60 * 1000
  return assets.filter((asset) => !referencedPublicIds.has(asset.publicId) && asset.createdAt.getTime() < cutoff)
}

// true = số video thừa bất thường → dừng, không xóa (ít video thì bỏ qua kiểm tra: 2/3 video thừa vẫn là chuyện thường)
export const isSuspiciousOrphanCount = (orphanCount: number, totalCount: number) =>
  totalCount >= 10 && orphanCount / totalCount > MAX_ORPHAN_RATIO

// Link HLS (.m3u8) của video: trình phát tự chọn chất lượng theo tốc độ mạng.
// Không phải video Cloudinary của mình → null (frontend phát link mp4 như cũ)
export const buildHlsUrl = (videoUrl: string | null, cloudName: string | undefined) => {
  if (!videoUrl || !cloudName) return null
  const parsed = parseCloudinaryVideoUrl(videoUrl, cloudName)
  if (!parsed) return null
  const version = parsed.version ? `v${parsed.version}/` : ''
  return `https://res.cloudinary.com/${cloudName}/video/upload/sp_${HLS_STREAMING_PROFILE}/${version}${parsed.publicId}.m3u8`
}
