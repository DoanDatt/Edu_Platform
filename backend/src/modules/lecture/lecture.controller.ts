import { Request, Response } from 'express'
import * as lectureService from './lecture.service'
import { CreateLectureBodyType, LectureParamsType, UpdateLectureBodyType } from './lecture.schema'

export const getLecture = async (req: Request, res: Response) => {
  const { lectureId } = req.params as unknown as LectureParamsType
  const lecture = await lectureService.getLectureForLearner(lectureId, req.user!)
  res.json({ message: 'Lấy bài giảng thành công', data: lecture })
}

export const createLecture = async (req: Request, res: Response) => {
  const body = req.body as CreateLectureBodyType
  const lecture = await lectureService.createLecture(body, req.user!.userId)
  res.status(201).json({ message: 'Tạo bài giảng thành công', data: lecture })
}

export const updateLecture = async (req: Request, res: Response) => {
  const { lectureId } = req.params as unknown as LectureParamsType
  const body = req.body as UpdateLectureBodyType
  const lecture = await lectureService.updateLecture(lectureId, body, req.user!.userId)
  res.json({ message: 'Cập nhật bài giảng thành công', data: lecture })
}

export const deleteLecture = async (req: Request, res: Response) => {
  const { lectureId } = req.params as unknown as LectureParamsType
  await lectureService.deleteLecture(lectureId, req.user!.userId)
  res.json({ message: 'Xóa bài giảng thành công' })
}
