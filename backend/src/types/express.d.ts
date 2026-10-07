import type { AccessTokenPayload, Decoded } from '../utils/jwt'

declare global {
  namespace Express {
    interface Request {
      user?: Decoded<AccessTokenPayload>
    }
  }
}

export {}
