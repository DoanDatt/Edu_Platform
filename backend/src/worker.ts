// Chạy worker thành process RIÊNG (npm run worker), tách khỏi server API.
// Khi deploy: chạy 1 hoặc nhiều process worker, đặt RUN_WORKER=false cho server API
import prisma from './lib/prisma'
import { startWorkers } from './queues/workers'

const main = async () => {
  const stopWorkers = await startWorkers()

  // Ctrl+C / hệ thống yêu cầu tắt → đợi job đang chạy xong rồi mới thoát
  const shutdown = async () => {
    console.log('Đang tắt worker...')
    await stopWorkers()
    await prisma.$disconnect()
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
