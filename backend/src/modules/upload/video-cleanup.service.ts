import envConfig from '../../config/env'
import { deleteVideos, isCloudinaryEnabled, listLectureVideos } from '../../lib/cloudinary'
import prisma from '../../lib/prisma'
import {
  findOrphanVideos,
  isSuspiciousOrphanCount,
  ORPHAN_GRACE_DAYS,
  parseCloudinaryVideoUrl,
} from '../../utils/video'

// Dọn video thừa trên Cloudinary: video không còn bài giảng nào dùng (bài bị xóa, giảng viên thay video khác,
// upload xong nhưng không lưu bài). Không dọn thì gói free (25 credit / tháng) đầy dần theo thời gian.
// dryRun: chỉ liệt kê, không xóa (script npm run video:cleanup mặc định chạy kiểu này)
export const cleanupOrphanVideos = async ({ dryRun }: { dryRun: boolean }) => {
  if (!isCloudinaryEnabled || !envConfig.CLOUDINARY_URL) return { skipped: 'Không có CLOUDINARY_URL' }
  const cloudName = new URL(envConfig.CLOUDINARY_URL).hostname

  // Video còn được dùng: bài giảng chưa xóa, hoặc xóa mềm chưa quá ORPHAN_GRACE_DAYS ngày (còn khôi phục được)
  const cutoff = new Date(Date.now() - ORPHAN_GRACE_DAYS * 24 * 60 * 60 * 1000)
  const lectures = await prisma.lecture.findMany({
    where: {
      videoUrl: { startsWith: `https://res.cloudinary.com/${cloudName}/video/upload/` },
      OR: [{ deletedAt: null }, { deletedAt: { gt: cutoff } }],
    },
    select: { videoUrl: true },
  })
  const referenced = new Set<string>()
  for (const { videoUrl } of lectures) {
    const parsed = videoUrl ? parseCloudinaryVideoUrl(videoUrl, cloudName) : null
    if (parsed) referenced.add(parsed.publicId)
  }

  const assets = await listLectureVideos()
  const orphans = findOrphanVideos(assets, referenced)
  const summary = {
    totalVideos: assets.length,
    referenced: referenced.size,
    orphans: orphans.length,
    orphanMb: Math.round(orphans.reduce((sum, asset) => sum + asset.bytes, 0) / 1024 / 1024),
    publicIds: orphans.map((asset) => asset.publicId),
  }

  // Phanh an toàn: quá nửa số video bị coi là thừa → nhiều khả năng đang so với nhầm database → không xóa
  if (isSuspiciousOrphanCount(orphans.length, assets.length)) {
    throw new Error(
      `Dừng dọn video: ${orphans.length}/${assets.length} video bị coi là thừa (quá nhiều). ` +
        'Kiểm tra DATABASE_URL và CLOUDINARY_URL có cùng một môi trường không',
    )
  }

  if (!dryRun && orphans.length > 0) await deleteVideos(summary.publicIds)
  return { ...summary, deleted: dryRun ? 0 : orphans.length }
}
