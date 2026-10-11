import { Request, Response } from 'express'
import * as courseService from './course.service'
import { CourseParamsType, CreateCourseBodyType, GetMyCoursesQueryType, UpdateCourseBodyType } from './course.schema'

export const getMyCourses = async (req: Request, res: Response) => {
  const query = req.query as unknown as GetMyCoursesQueryType
  // "của tôi" = lấy theo id người đang đăng nhập
  const result = await courseService.getMyCourses(req.user!.userId, query)
  res.json({ message: 'Lấy danh sách khoá học của bạn thành công', ...result })
}

export const getMyCourseById = async (req: Request, res: Response) => {
  const { courseId } = req.params as unknown as CourseParamsType
  const course = await courseService.getMyCourseById(courseId, req.user!.userId)
  res.json({ message: 'Lấy khoá học thành công', data: course })
}

export const createCourse = async (req: Request, res: Response) => {
  const body = req.body as CreateCourseBodyType
  const course = await courseService.createCourse(body, req.user!.userId)
  res.status(201).json({ message: 'Tạo khoá học thành công', data: course })
}

export const updateCourse = async (req: Request, res: Response) => {
  const { courseId } = req.params as unknown as CourseParamsType
  const body = req.body as UpdateCourseBodyType
  const course = await courseService.updateCourse(courseId, body, req.user!.userId)
  res.json({ message: 'Cập nhật khoá học thành công', data: course })
}

export const deleteCourse = async (req: Request, res: Response) => {
  const { courseId } = req.params as unknown as CourseParamsType
  await courseService.deleteCourse(courseId, req.user!.userId)
  res.json({ message: 'Xoá khoá học thành công' })
}
