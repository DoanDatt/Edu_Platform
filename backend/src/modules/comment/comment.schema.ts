import z from 'zod'
import { PaginationQuerySchema } from '../../utils/pagination'

// GET /courses/:courseId/comments?page=1&limit=10
export const GetCommentsQuerySchema = PaginationQuerySchema

export type GetCommentsQueryType = z.infer<typeof GetCommentsQuerySchema>

// POST /courses/:courseId/comments
// Khách: bắt buộc name + email (kiểm tra ở service vì đang đăng nhập thì lấy từ tài khoản, không cần gửi)
export const CreateCommentBodySchema = z
  .object({
    name: z.string().trim().min(1, 'Vui lòng nhập tên').max(100).optional(),
    email: z.email('Email không hợp lệ').max(200).optional(),
    content: z.string().trim().min(1, 'Vui lòng nhập bình luận').max(2000, 'Bình luận tối đa 2000 ký tự'),
  })
  .strict()

export type CreateCommentBodyType = z.infer<typeof CreateCommentBodySchema>
