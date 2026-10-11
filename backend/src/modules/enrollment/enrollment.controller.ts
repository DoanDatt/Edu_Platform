import { Request, Response } from 'express'
import * as enrollmentService from './enrollment.service'
import {
  CreateEnrollmentBodyType,
  EnrollmentCourseParamsType,
  GetMyEnrollmentsQueryType,
} from './enrollment.schema'
import { LectureParamsType } from '../lecture/lecture.schema'

export const enroll = async (req: Request, res: Response) => {
  const body = req.body as CreateEnrollmentBodyType
  const enrollment = await enrollmentService.enroll(body, req.user!.userId)
  res.status(201).json({ message: 'Ghi danh thành công', data: enrollment })
}

export const getMyEnrollments = async (req: Request, res: Response) => {
  const query = req.query as unknown as GetMyEnrollmentsQueryType
  const result = await enrollmentService.getMyEnrollments(req.user!.userId, query)
  res.json({ message: 'Lấy danh sách khóa học đã ghi danh thành công', ...result })
}

export const getMyLearning = async (req: Request, res: Response) => {
  const { courseId } = req.params as unknown as EnrollmentCourseParamsType
  const learning = await enrollmentService.getMyLearning(req.user!.userId, courseId)
  res.json({ message: 'Lấy tiến độ học thành công', data: learning })
}

// Hai route dưới nằm trong lectureRouter: /lectures/:lectureId/complete
export const completeLecture = async (req: Request, res: Response) => {
  const { lectureId } = req.params as unknown as LectureParamsType
  const result = await enrollmentService.completeLecture(lectureId, req.user!.userId)
  res.json({ message: 'Đã đánh dấu hoàn thành bài giảng', data: result })
}

export const uncompleteLecture = async (req: Request, res: Response) => {
  const { lectureId } = req.params as unknown as LectureParamsType
  const result = await enrollmentService.uncompleteLecture(lectureId, req.user!.userId)
  res.json({ message: 'Đã bỏ đánh dấu hoàn thành', data: result })
}
