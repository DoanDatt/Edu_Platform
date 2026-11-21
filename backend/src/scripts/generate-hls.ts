import envConfig from '../config/env'
import prisma from '../lib/prisma'
import { generateHlsForExisting } from '../lib/cloudinary'
import { parseCloudinaryVideoUrl } from '../utils/video'

// Video upload TRƯỚC khi có HLS chưa có bản .m3u8 tạo sẵn. Gói free chỉ tạo lúc phát được cho video < 40MB,
// video lớn hơn thì trình phát lỗi HLS và quay về mp4. Script này nhờ Cloudinary tạo bù (chạy nền, vài phút).
// Chạy 1 lần sau khi deploy, với DATABASE_URL + CLOUDINARY_URL của production:
//   npm run video:hls            → tạo thật
//   npm run video:hls -- --dry   → chỉ in ra video nào sẽ được tạo
const main = async () => {
  if (!envConfig.CLOUDINARY_URL) {
    throw new Error('Cần CLOUDINARY_URL để chạy script này')
  }
  const cloudName = new URL(envConfig.CLOUDINARY_URL).hostname
  const dryRun = process.argv.includes('--dry')

  // Lấy cả bài đã xóa mềm: không tốn gì nhiều, khôi phục lại vẫn phát được HLS
  const lectures = await prisma.lecture.findMany({
    where: { videoUrl: { startsWith: `https://res.cloudinary.com/${cloudName}/video/upload/` } },
    select: { id: true, videoUrl: true },
  })
  // Nhiều bài có thể dùng chung 1 video → mỗi video chỉ gửi 1 lần
  const publicIds = new Set<string>()
  for (const lecture of lectures) {
    const parsed = lecture.videoUrl ? parseCloudinaryVideoUrl(lecture.videoUrl, cloudName) : null
    if (parsed) publicIds.add(parsed.publicId)
  }

  console.log(`${lectures.length} bài giảng, ${publicIds.size} video Cloudinary`)
  let failed = 0
  for (const publicId of publicIds) {
    if (dryRun) {
      console.log(`[dry] ${publicId}`)
      continue
    }
    try {
      await generateHlsForExisting(publicId)
      console.log(`Đã gửi yêu cầu tạo HLS: ${publicId}`)
    } catch (error) {
      failed++
      console.error(`Lỗi ${publicId}:`, error)
    }
  }
  if (failed) process.exitCode = 1
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
