import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import type { StringValue } from 'ms'
import envConfig from '../config/env'

export type AccessTokenPayload = {
  userId: number
  roleName: string
}

export type RefreshTokenPayload = {
  userId: number
}

// Thư viện tự thêm iat (lúc tạo) và exp (lúc hết hạn), tính bằng giây
export type Decoded<T> = T & { iat: number; exp: number }

export const signAccessToken = (payload: AccessTokenPayload) => {
  return jwt.sign(payload, envConfig.ACCESS_TOKEN_SECRET, {
    algorithm: 'HS256',
    expiresIn: envConfig.ACCESS_TOKEN_EXPIRES_IN as StringValue,
    // Mã ngẫu nhiên: 2 token tạo trong cùng 1 giây vẫn khác nhau
    jwtid: randomUUID(),
  })
}

export const signRefreshToken = (payload: RefreshTokenPayload) => {
  return jwt.sign(payload, envConfig.REFRESH_TOKEN_SECRET, {
    algorithm: 'HS256',
    expiresIn: envConfig.REFRESH_TOKEN_EXPIRES_IN as StringValue,
    jwtid: randomUUID(),
  })
}

// Sai chữ ký hoặc hết hạn → jwt.verify ném lỗi
export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, envConfig.ACCESS_TOKEN_SECRET, { algorithms: ['HS256'] }) as Decoded<AccessTokenPayload>
}

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, envConfig.REFRESH_TOKEN_SECRET, { algorithms: ['HS256'] }) as Decoded<RefreshTokenPayload>
}
