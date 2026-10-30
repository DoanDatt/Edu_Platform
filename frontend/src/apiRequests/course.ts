import http from '@/lib/http'
import { toQueryString } from '@/lib/utils'
import { MessageResType } from '@/schemaValidations/common.schema'
import {
  AdminCourseDetailResType,
  AdminCourseListResType,
  CourseFiltersResType,
  CourseStudentListResType,
  CreateCourseBodyType,
  GetAdminCoursesQueryType,
  GetCourseStudentsQueryType,
  GetCoursesQueryType,
  GetMyCoursesQueryType,
  InstructorCourseDetailResType,
  InstructorCourseListResType,
  InstructorCourseResType,
  PublicCourseDetailResType,
  PublicCourseListResType,
  RejectCourseBodyType,
  UpdateCourseBodyType
} from '@/schemaValidations/course.schema'

export const courseApiRequest = {
  list: (query?: Partial<GetCoursesQueryType>) => http.get<PublicCourseListResType>(`/courses${toQueryString(query)}`),
  // Cột lọc của trang danh sách: lựa chọn + số khóa
  filters: () => http.get<CourseFiltersResType>('/courses/filters'),
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
    http.get<CourseStudentListResType>(`/courses/mine/${id}/students${toQueryString(query)}`),

  // ===== Admin =====
  adminList: (query?: Partial<GetAdminCoursesQueryType>) =>
    http.get<AdminCourseListResType>(`/courses/admin${toQueryString(query)}`),
  adminGetDetail: (id: number) => http.get<AdminCourseDetailResType>(`/courses/admin/${id}`),
  // Duyệt / từ chối / gỡ chỉ đổi trạng thái → trả khóa KHÔNG kèm mục lục (giống tạo / sửa)
  approve: (id: number) => http.post<InstructorCourseResType>(`/courses/${id}/approve`, null),
  reject: (id: number, body: RejectCourseBodyType) =>
    http.post<InstructorCourseResType>(`/courses/${id}/reject`, body),
  unpublish: (id: number, body: RejectCourseBodyType) =>
    http.post<InstructorCourseResType>(`/courses/${id}/unpublish`, body)
}

export default courseApiRequest
