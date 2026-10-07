import { PrismaPg } from '@prisma/adapter-pg'
import envConfig from '../config/env'
import { PrismaClient } from '../generated/prisma/client'

const adapter = new PrismaPg({
  connectionString: envConfig.DATABASE_URL,
})

const prisma = new PrismaClient({ adapter })

export default prisma
