import z from 'zod'
import { PaginationRes } from './common.schema'

// Bình luận dưới trang chi tiết khóa học (backend: GET/POST /courses/:courseId/comments).
// Backend KHÔNG trả email (chỉ để liên hệ). user: null = khách bình luận
export const CommentSchema = z.object({
  id: z.number(),
  name: z.string(),
  content: z.string(),
  createdAt: z.string(),
  user: z.object({ id: z.number(), avatar: z.string().nullable() }).nullable()
})
export type CommentType = z.infer<typeof CommentSchema>

export const CommentListRes = PaginationRes.extend({
  data: z.array(CommentSchema),
  message: z.string()
})
export type CommentListResType = z.infer<typeof CommentListRes>

export const CommentRes = z.object({ data: CommentSchema, message: z.string() })
export type CommentResType = z.infer<typeof CommentRes>

// Form "Leave A Comment". Đang đăng nhập thì form ẩn ô tên + email (backend lấy từ tài khoản)
export const CreateCommentBody = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên').max(100).optional(),
  email: z.email('Email không hợp lệ').max(200).optional(),
  content: z.string().trim().min(1, 'Vui lòng nhập bình luận').max(2000)
})
export type CreateCommentBodyType = z.infer<typeof CreateCommentBody>
