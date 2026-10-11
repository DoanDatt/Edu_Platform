import { ErrorRequestHandler, RequestHandler } from 'express'
import { HttpError } from '../utils/error'

// không route nào khớp -> 404 dạng JSON
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    message: `Không tìm thấy ${req.method} ${req.originalUrl}`,
  })
}

// Mọi lỗi throw từ middleware/controller/server đều về đây.
// Phải giữ đủ 4 tham số (kể cả _next không dùng): Express nhận ra error handler nhờ số tham số
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // Lỗi mình chủ động ném (409, 422,....) -> trả đúng status và message
  if (err instanceof HttpError) {
    res.status(err.status).json({
      message: err.message,
      errors: err.errors,
    })
    return
  }
  // Client gửi body không phải JSON
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({
      message: 'Body không phải JSON hợp lệ',
    })
    return
  }
  // Lỗi không lường trước (mất kết nối DB, bug,...) -> ghi log
  console.error(err)
  res.status(500).json({
    message: 'Lỗi hệ thống, vui lòng thử lại sau',
  })
}
