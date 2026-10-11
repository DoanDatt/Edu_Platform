import { Request, Response } from 'express'
import * as courseService from './course.service'
import {
  CourseParamsType,
  CreateCourseBodyType,
  GetCoursesQueryType,
  GetMyCoursesQueryType,
  GetPendingCoursesQueryType,
  RejectCourseBodyType,
  UpdateCourseBodyType,
} from './course.schema'

// ----- Công khai -----

export const getPublicCourses = async (req: Request, res: Response) => {
  const query = req.query as unknown as GetCoursesQueryType
  const result = await courseService.getPublicCourses(query)
  res.json({ message: 'Lấy danh sách khóa học thành công', ...result })
}

export const getPublicCourseById = async (req: Request, res: Response) => {
  const { courseId } = req.params as unknown as CourseParamsType
  // req.user chỉ có khi người xem gửi token hợp lệ (optionalAuth)
  const course = await courseService.getPublicCourseById(courseId, req.user?.userId)
  res.json({ message: 'Lấy khóa học thành công', data: course })
}

// ----- Giảng viên -----

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

// ----- Luồng duyệt -----

export const submitCourse = async (req: Request, res: Response) => {
  const { courseId } = req.params as unknown as CourseParamsType
  const course = await courseService.submitCourse(courseId, req.user!.userId)
  res.json({ message: 'Đã gửi khóa học để duyệt', data: course })
}

export const getPendingCourses = async (req: Request, res: Response) => {
  const query = req.query as unknown as GetPendingCoursesQueryType
  const result = await courseService.getPendingCourses(query)
  res.json({ message: 'Lấy danh sách khóa học chờ duyệt thành công', ...result })
}

export const getCourseForAdmin = async (req: Request, res: Response) => {
  const { courseId } = req.params as unknown as CourseParamsType
  const course = await courseService.getCourseForAdmin(courseId)
  res.json({ message: 'Lấy khóa học thành công', data: course })
}

export const approveCourse = async (req: Request, res: Response) => {
  const { courseId } = req.params as unknown as CourseParamsType
  const course = await courseService.approveCourse(courseId)
  res.json({ message: 'Đã duyệt khóa học', data: course })
}

export const rejectCourse = async (req: Request, res: Response) => {
  const { courseId } = req.params as unknown as CourseParamsType
  const { reason } = req.body as RejectCourseBodyType
  const course = await courseService.rejectCourse(courseId, reason)
  res.json({ message: 'Đã từ chối khóa học', data: course })
}
