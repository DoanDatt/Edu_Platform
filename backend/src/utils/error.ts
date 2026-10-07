export type FieldError = { field: string; message: string }
export class HttpError extends Error {
  status: number
  errors?: FieldError[]

  constructor(status: number, message: string, errors?: FieldError[]) {
    super(message)
    this.status = status
    this.errors = errors
  }
}
