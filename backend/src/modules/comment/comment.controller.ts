import { Request, Response } from 'express'
import { CourseParamsType } from '../course/course.schema'
import { CreateCommentBodyType, GetCommentsQueryType } from './comment.schema'
import * as commentService from './comment.service'

export const getComments = async (req: Request, res: Response) => {
  const { courseId } = req.params as unknown as CourseParamsType
  const query = req.query as unknown as GetCommentsQueryType
  const result = await commentService.getComments(courseId, query)
  res.json({ message: 'Lấy bình luận thành công', ...result })
}

export const createComment = async (req: Request, res: Response) => {
  const { courseId } = req.params as unknown as CourseParamsType
  const body = req.body as CreateCommentBodyType
  // req.user chỉ có khi người gửi kèm token hợp lệ (optionalAuth)
  const comment = await commentService.createComment(courseId, body, req.user?.userId)
  res.status(201).json({ message: 'Gửi bình luận thành công', data: comment })
}
