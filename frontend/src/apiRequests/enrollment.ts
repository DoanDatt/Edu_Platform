import http from '@/lib/http'
import { toQueryString } from '@/lib/utils'
import { PaginationQueryType } from '@/schemaValidations/common.schema'
import {
  CreateEnrollmentBodyType,
  EnrollmentResType,
  MyEnrollmentDetailResType,
  MyEnrollmentListResType
} from '@/schemaValidations/enrollment.schema'

// Gọi từ Client Component (nút ghi danh) → http.ts tự gắn token từ localStorage, không cần truyền
export const enrollmentApiRequest = {
  // POST /enrollments { courseId }
  create: (body: CreateEnrollmentBodyType) => http.post<EnrollmentResType>('/enrollments', body),
  mine: (query?: Partial<PaginationQueryType>) =>
    http.get<MyEnrollmentListResType>(`/enrollments/mine${toQueryString(query)}`),
  // get /enrollments/mine/:courseId:  mục lục + bài nào đã học + tiến độ (trang học)
  getMine: (courseId: number) => http.get<MyEnrollmentDetailResType>(`/enrollments/mine/${courseId}`)
}

export default enrollmentApiRequest
