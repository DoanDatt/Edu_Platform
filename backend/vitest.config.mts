import { defineConfig } from 'vitest/config'
import { buildTestEnv } from './tests/test-env.mts'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    env: buildTestEnv(),
    // Dựng lại database test 1 lần trước khi chạy (migrate reset + seed + sync quyền)
    globalSetup: './tests/global-setup.ts',
    // Chạy trước MỖI file test: giả lập hàng đợi email, ngắt kết nối DB khi xong
    setupFiles: ['./tests/setup.ts'],
    // Các file test dùng chung 1 database → chạy lần lượt cho khỏi giẫm chân nhau
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 180_000,
  },
})
