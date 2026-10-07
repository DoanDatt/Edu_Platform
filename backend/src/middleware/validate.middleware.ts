import { NextFunction, Request, Response } from 'express'
import z from 'zod'
import { HttpError } from '../utils/error'

export const validateBody = (schema: z.ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))
      throw new HttpError(422, 'Dữ liệu không hợp lệ', errors)
    }
    req.body = result.data
    next()
  }
}
