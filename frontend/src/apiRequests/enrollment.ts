import http from '@/lib/http'
import { CreateEnrollmentBodyType, EnrollmentResType } from '@/schemaValidations/enrollment.schema'

const prefix = '/enrollments'

// Mốc 2 chỉ cần nút Ghi danh ở trang chi tiết.
// Mốc 3 bổ sung: getMine (Khóa học của tôi), getLearning (trang học)
const enrollmentApiRequest = {
  // 409: đã ghi danh / là giảng viên của khóa · 402: khóa có phí (chưa có thanh toán)
  create: (body: CreateEnrollmentBodyType) => http.post<EnrollmentResType>(prefix, body)
}

export default enrollmentApiRequest
