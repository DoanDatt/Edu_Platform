import { Role } from '../generated/prisma/enums';
import type { Request } from 'express';

export interface JwtPayload {
  sub: string;
  role: Role;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
