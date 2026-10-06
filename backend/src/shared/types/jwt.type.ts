export interface TokenPayload {
  userId: number
  exp: number // thời điểm hết hạn,
  iat: number // thời điểm tạo
}
