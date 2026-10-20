import http from '@/lib/http'
import { toQueryString } from '@/lib/utils'
import {
  GetCoursesQueryType,
  PublicCourseDetailResType,
  PublicCourseListResType
} from '@/schemaValidations/course.schema'

export const courseApiRequest = {
  list: (query?: Partial<GetCoursesQueryType>) => http.get<PublicCourseListResType>(`/courses${toQueryString(query)}`),
  // trang chi tiết là server component, mà ở server không có localstorage. Vì vậy http.ts không tự gắn được
  // token như chạy ở trình duyệt
  getDetail: (id: number, accessToken?: string) =>
    http.get<PublicCourseDetailResType>(`/courses/${id}`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
    })
}

export default courseApiRequest
