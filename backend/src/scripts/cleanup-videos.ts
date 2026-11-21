import prisma from '../lib/prisma'
import { cleanupOrphanVideos } from '../modules/upload/video-cleanup.service'

// Dọn video thừa trên Cloudinary bằng tay (job hằng ngày chỉ chạy khi VIDEO_CLEANUP_ENABLED=true).
// Chạy với DATABASE_URL + CLOUDINARY_URL CÙNG một môi trường (vd cả 2 của production):
//   npm run video:cleanup              → chỉ liệt kê video sẽ bị xóa (mặc định, an toàn)
//   npm run video:cleanup -- --apply   → xóa thật
const main = async () => {
  const apply = process.argv.includes('--apply')
  const result = await cleanupOrphanVideos({ dryRun: !apply })
  if ('skipped' in result) {
    console.log('Bỏ qua:', result.skipped)
    return
  }
  console.log(
    `${result.totalVideos} video trên Cloudinary, ${result.referenced} video đang được bài giảng dùng, ` +
      `${result.orphans} video thừa (~${result.orphanMb} MB)`,
  )
  for (const publicId of result.publicIds) console.log(`  ${apply ? 'Đã xóa' : '[dry]'} ${publicId}`)
  if (!apply && result.orphans > 0) console.log('Chưa xóa gì. Thêm --apply để xóa thật')
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
