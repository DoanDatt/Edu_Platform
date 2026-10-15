import http from '@/lib/http'
import { toQueryString } from '@/lib/utils'
import { MessageResType } from '@/schemaValidations/common.schema'
import {
  AdminCourseDetailResType,
  AdminCourseListResType,
  CourseResType,
  CourseStudentListResType,
  CreateCourseBodyType,
  GetAdminCoursesQueryType,
  GetCourseStudentsQueryType,
  GetCoursesQueryType,
  GetMyCoursesQueryType,
  GetPendingCoursesQueryType,
  MyCourseDetailResType,
  MyCourseListResType,
  PendingCourseListResType,
  PublicCourseDetailResType,
  PublicCourseListResType,
  RejectCourseBodyType,
  UnpublishCourseBodyType,
  UpdateCourseBodyType
} from '@/schemaValidations/course.schema'

const prefix = '/courses'

// Course KHÔNG cần cặp sX / X như auth: không ghi cookie → không cần Route Handler,
// mọi hàm gọi thẳng backend. Ở trình duyệt, http.ts tự gắn token từ localStorage.
//
// Query dùng Partial<...>: kiểu Zod có default (page, limit, sort) nên bắt buộc sau khi parse,
// nhưng lúc GỌI API thì không truyền cũng được, backend tự lấy giá trị mặc định
const courseApiRequest = {
  // ===== Công khai =====

  // GET /courses?search&categoryId&level&price&sort&page&limit
  list: (query?: Partial<GetCoursesQueryType>) =>
    http.get<PublicCourseListResType>(`${prefix}${toQueryString(query)}`),

  // GET /courses/:id. Thường gọi từ Server Component: ở server không có localStorage nên
  // http.ts KHÔNG tự gắn token → truyền accessToken (đọc từ cookie) nếu có, để biết isEnrolled.
  // Không truyền → isEnrolled: null (coi như khách)
  getDetail: (id: number, accessToken?: string) =>
    http.get<PublicCourseDetailResType>(`${prefix}/${id}`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
    }),

  // ===== Giảng viên =====

  // GET /courses/mine?status&page&limit
  getMine: (query?: Partial<GetMyCoursesQueryType>) =>
    http.get<MyCourseListResType>(`${prefix}/mine${toQueryString(query)}`),

  // GET /courses/mine/:id: kèm mục lục đầy đủ để soạn bài
  getMineDetail: (id: number) => http.get<MyCourseDetailResType>(`${prefix}/mine/${id}`),

  // GET /courses/mine/:id/students
  getStudents: (id: number, query?: Partial<GetCourseStudentsQueryType>) =>
    http.get<CourseStudentListResType>(`${prefix}/mine/${id}/students${toQueryString(query)}`),

  create: (body: CreateCourseBodyType) => http.post<CourseResType>(prefix, body),

  update: (id: number, body: UpdateCourseBodyType) => http.put<CourseResType>(`${prefix}/${id}`, body),

  delete: (id: number) => http.delete<MessageResType>(`${prefix}/${id}`),

  // DRAFT / REJECTED → PENDING. Body rỗng nên truyền null
  submit: (id: number) => http.post<CourseResType>(`${prefix}/${id}/submit`, null),

  // ===== Admin =====

  // GET /courses/admin?search&status&instructorId&categoryId&page&limit
  getAdminList: (query?: Partial<GetAdminCoursesQueryType>) =>
    http.get<AdminCourseListResType>(`${prefix}/admin${toQueryString(query)}`),

  // GET /courses/pending?page&limit
  getPending: (query?: Partial<GetPendingCoursesQueryType>) =>
    http.get<PendingCourseListResType>(`${prefix}/pending${toQueryString(query)}`),

  // GET /courses/admin/:id: xem mọi trạng thái + mục lục + giảng viên
  getAdminDetail: (id: number) => http.get<AdminCourseDetailResType>(`${prefix}/admin/${id}`),

  approve: (id: number) => http.post<CourseResType>(`${prefix}/${id}/approve`, null),

  reject: (id: number, body: RejectCourseBodyType) => http.post<CourseResType>(`${prefix}/${id}/reject`, body),

  unpublish: (id: number, body: UnpublishCourseBodyType) =>
    http.post<CourseResType>(`${prefix}/${id}/unpublish`, body)
}

export default courseApiRequest
