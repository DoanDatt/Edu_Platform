import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
// Các module sau này (User, Course,...) dùng được PrismaSerice ngay mà không cần import PrismaModule lần nữa
@Module({
  providers: [PrismaService],
  // các service mà module này tạo ra
  exports: [PrismaService],
  // cho phép module khác dùng PrismaService, nếu thiếu dòng này chỉ dùng được bên trong PrismaModule
})
export class PrismaModule {}
