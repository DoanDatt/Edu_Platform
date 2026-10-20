import http from '@/lib/http'
import { CreateEnrollmentBodyType, EnrollmentResType } from '@/schemaValidations/enrollment.schema'

// Gọi từ Client Component (nút ghi danh) → http.ts tự gắn token từ localStorage, không cần truyền
export const enrollmentApiRequest = {
  // POST /enrollments { courseId }
  create: (body: CreateEnrollmentBodyType) => http.post<EnrollmentResType>('/enrollments', body)
}

export default enrollmentApiRequest
