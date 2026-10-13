import { execSync } from 'child_process'
import { Client } from 'pg'
import { buildTestEnv } from './test-env.mts'

// Chạy 1 lần trước toàn bộ test. KHÔNG xóa dữ liệu gì (an toàn):
//  1. Chưa có database test thì tạo mới
//  2. Áp dụng migration còn thiếu (migrate deploy, không reset)
//  3. Chưa có role thì seed (role + admin); luôn sync permission (chạy lại nhiều lần không sao)
// Test dùng email / tên ngẫu nhiên nên dữ liệu của các lần chạy trước không ảnh hưởng.
// Muốn dọn sạch DB test: xóa database edu_platform_test bằng tay, lần chạy sau tự tạo lại
export default async function setup() {
  const testEnv = buildTestEnv()
  const env = { ...process.env, ...testEnv }
  const testUrl = new URL(testEnv.DATABASE_URL)
  const dbName = decodeURIComponent(testUrl.pathname.slice(1))

  // Kết nối vào database "postgres" (luôn có sẵn) để kiểm tra / tạo database test
  const adminUrl = new URL(testUrl)
  adminUrl.pathname = '/postgres'
  adminUrl.search = ''
  const client = new Client({ connectionString: adminUrl.toString() })
  await client.connect()
  try {
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName])
    if (rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`)
    }
  } finally {
    await client.end()
  }

  const run = (command: string) => execSync(command, { env, stdio: 'pipe' })
  run('npx prisma migrate deploy')

  const db = new Client({ connectionString: testEnv.DATABASE_URL.split('?')[0] })
  await db.connect()
  const { rows } = await db.query('SELECT count(*)::int AS n FROM "Role"')
  await db.end()
  if (rows[0].n === 0) run('npx tsx src/scripts/seed.ts')

  run('npx tsx src/scripts/sync-permissions.ts')
}
