import { Injectable } from '@nestjs/common'
import { PrismaClient } from '../../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import envConfig from '../config'

// Cấu hình kết nối tới psql, và dùng để truy vấn
@Injectable()
// class PrismaService kế thừa từ PrismaClient
export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: envConfig.DATABASE_URL,
    })
    super({ adapter, log: ['info'] })
  }
}
