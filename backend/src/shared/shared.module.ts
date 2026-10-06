import { Global, Module } from '@nestjs/common'
import { PrismaService } from './services/prisma.service'
import { HashingService } from './services/hashing.service'
import { JwtModule } from '@nestjs/jwt'
import { TokenService } from './services/token.services'

const sharedServices = [PrismaService, HashingService, TokenService]

// cho phép mọi module dùng PrismaService mà không cần import ShareModule
@Global()
@Module({
  providers: sharedServices,
  exports: sharedServices,
  imports: [JwtModule],
})
export class SharedModule {}
