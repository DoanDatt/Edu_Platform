import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';
import { Env } from '../config/env.schema';

@Injectable()
//có toàn bộ chức năng của Prisma, nên ở chỗ khác có thể viết được this.prims.user.findMany()
// là 1 lifecycle hook của Nestjs, Nest gọi chúng khi app khởi động và khi app tắt, để mở và đóng kết nối database
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService<Env, true>) {
    const adapter = new PrismaPg({
      connectionString: config.get('DATABASE_URL', { infer: true }),
    });
    super({ adapter });
  }
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
