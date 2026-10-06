import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './auth.schema';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../generated/prisma/client';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}
  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    try {
      return await this.prisma.user.create({
        data: {
          email: dto.email,
          fullName: dto.fullName,
          passwordHash,
        },
        omit: { passwordHash: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email đã được sử dụng');
      }
      throw error;
    }
  }
  async login(dto: LoginDto) {
    // tìm user theo email, không tìm thấy thì findUnique trả về null
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Dùng chung 1 câu báo lỗi cho "không có email" và "sai mật khẩu"
    // để kẻ xấu không dò được email nào đã đăng ký
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    // bcrypt đọc salt trong passwordHash, hash lại pass vừa nhập, rồi so sánh
    // compare là kiểm tra mật khẩu người dùng nhập có khớp với hash đã lưu hay không
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
    });

    return { accessToken };
  }
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      omit: { passwordHash: true },
    });
    if (!user) {
      throw new UnauthorizedException('Tài khoản không còn tồn tại');
    }
    return user;
  }
}
