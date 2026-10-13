import { Queue } from 'bullmq'
import { redisConnection } from './connection'

export const MAINTENANCE_QUEUE = 'maintenance'
export const CLEANUP_JOB = 'cleanup-expired'

// Lên lịch dọn dữ liệu lúc 3h sáng mỗi ngày (cú pháp cron: phút giờ ngày tháng thứ).
// upsert: chạy lại nhiều lần (mỗi lần khởi động) vẫn chỉ có 1 lịch, không bị nhân đôi
export const scheduleMaintenanceJobs = async () => {
  const queue = new Queue(MAINTENANCE_QUEUE, { connection: redisConnection })
  await queue.upsertJobScheduler(CLEANUP_JOB, { pattern: '0 3 * * *' }, { name: CLEANUP_JOB })
  await queue.close()
}
