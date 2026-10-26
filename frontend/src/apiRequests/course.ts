import http from '@/lib/http'
import { toQueryString } from '@/lib/utils'
import { MessageResType } from '@/schemaValidations/common.schema'
import {
  CourseStudentListResType,
  CreateCourseBodyType,
  GetCourseStudentsQueryType,
  GetCoursesQueryType,
  GetMyCoursesQueryType,
  InstructorCourseDetailResType,
  InstructorCourseListResType,
  InstructorCourseResType,
  PublicCourseDetailResType,
  PublicCourseListResType,
  UpdateCourseBodyType
} from '@/schemaValidations/course.schema'

export const courseApiRequest = {
  list: (query?: Partial<GetCoursesQueryType>) => http.get<PublicCourseListResType>(`/courses${toQueryString(query)}`),
  // trang chi tiết là server component, mà ở server không có localstorage. Vì vậy http.ts không tự gắn được
  // token như chạy ở trình duyệt
  getDetail: (id: number, accessToken?: string) =>
    http.get<PublicCourseDetailResType>(`/courses/${id}`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
    }),
  mine: (query?: Partial<GetMyCoursesQueryType>) =>
    http.get<InstructorCourseListResType>(`/courses/mine${toQueryString(query)}`),
  getMine: (id: number) => http.get<InstructorCourseDetailResType>(`/courses/mine/${id}`),
  // Tạo / sửa trả khóa KHÔNG kèm mục lục → InstructorCourseRes (getMine mới có sections)
  create: (body: CreateCourseBodyType) => http.post<InstructorCourseResType>('/courses', body),
  update: (id: number, body: UpdateCourseBodyType) => http.put<InstructorCourseResType>(`/courses/${id}`, body),
  delete: (id: number) => http.delete<MessageResType>(`/courses/${id}`),
  // Gửi duyệt: DRAFT / REJECTED → PENDING. Không có body (id trên đường dẫn là đủ) → gửi null
  submit: (id: number) => http.post<InstructorCourseResType>(`/courses/${id}/submit`, null),
  students: (id: number, query?: Partial<GetCourseStudentsQueryType>) =>
    http.get<CourseStudentListResType>(`/courses/mine/${id}/students${toQueryString(query)}`)
}

export default courseApiRequest
