import z from 'zod'
import { HttpError } from '../utils/error'
import { Request, Response, NextFunction } from 'express'

const parseOrThrow = <T extends z.ZodType>(schema: T, data: unknown): z.infer<T> => {
  const result = schema.safeParse(data)
  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }))
    throw new HttpError(422, 'Dữ liệu không hợp lệ', errors)
  }
  return result.data
}

export const validateBody = (schema: z.ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.body = parseOrThrow(schema, req.body)
    next()
  }
}

export const validateParams = (schema: z.ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.params = parseOrThrow(schema, req.params) as Request['params']

    next()
  }
}

export const validateQuery = (schema: z.ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = parseOrThrow(schema, req.query)
    Object.defineProperty(req, 'query', { value: data, writable: true })
    next()
  }
}
