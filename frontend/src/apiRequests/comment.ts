import http from '@/lib/http'
import { toQueryString } from '@/lib/utils'
import { CommentListResType, CommentResType, CreateCommentBodyType } from '@/schemaValidations/comment.schema'
import { PaginationQueryType } from '@/schemaValidations/common.schema'

// Bình luận dưới trang chi tiết khóa học. Công khai: khách cũng gửi được.
// Đang đăng nhập thì http.ts tự gắn token → backend lấy tên + email từ tài khoản
const commentApiRequest = {
  list: (courseId: number, query?: Partial<PaginationQueryType>) =>
    http.get<CommentListResType>(`/courses/${courseId}/comments${toQueryString(query)}`),
  create: (courseId: number, body: CreateCommentBodyType) =>
    http.post<CommentResType>(`/courses/${courseId}/comments`, body)
}

export default commentApiRequest
