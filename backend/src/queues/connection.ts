import envConfig from '../config/env'

// Kết nối Redis cho BullMQ.
// maxRetriesPerRequest: null là yêu cầu bắt buộc của BullMQ cho Worker (lệnh chờ job có thể đợi rất lâu)
export const redisConnection = {
  url: envConfig.REDIS_URL,
  maxRetriesPerRequest: null,
}

// Phía GỬI job (trong lúc xử lý request): Redis sập thì không được treo request mãi.
// Đợi tối đa `ms`, quá thì báo lỗi để caller tự quyết định (bỏ qua hay trả lỗi cho client)
export const withTimeout = <T>(promise: Promise<T>, ms = 3000): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Redis không phản hồi sau ${ms}ms`)), ms)),
  ])
