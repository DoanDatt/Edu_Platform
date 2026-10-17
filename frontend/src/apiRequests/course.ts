import http from '@/lib/http'
import { toQueryString } from '@/lib/utils'
import {
  GetCoursesQueryType,
  PublicCourseDetailResType,
  PublicCourseListResType
} from '@/schemaValidations/course.schema'

const prefix = '/courses'

// Course KHÔNG cần cặp sX / X như auth: không ghi cookie → không cần Route Handler,
// mọi hàm gọi thẳng backend. Ở trình duyệt, http.ts tự gắn token từ localStorage.
//
// Query dùng Partial<...>: kiểu Zod có default (page, limit, sort) nên bắt buộc sau khi parse,
// nhưng lúc GỌI API thì không truyền cũng được, backend tự lấy giá trị mặc định
//
// Hiện chỉ có phần CÔNG KHAI. Phần giảng viên / admin thêm vào khi làm Mốc 4, 5
const courseApiRequest = {
  // GET /courses?search&categoryId&level&price&sort&page&limit
  list: (query?: Partial<GetCoursesQueryType>) =>
    http.get<PublicCourseListResType>(`${prefix}${toQueryString(query)}`),

  // GET /courses/:id. Thường gọi từ Server Component: ở server không có localStorage nên
  // http.ts KHÔNG tự gắn token → truyền accessToken (đọc từ cookie) nếu có, để biết isEnrolled.
  // Không truyền → isEnrolled: null (coi như khách)
  getDetail: (id: number, accessToken?: string) =>
    http.get<PublicCourseDetailResType>(`${prefix}/${id}`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
    })
}

export default courseApiRequest
