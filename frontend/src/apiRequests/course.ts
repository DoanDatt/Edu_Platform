import http from '@/lib/http'
import { toQueryString } from '@/lib/utils'
import {
  GetCoursesQueryType,
  GetMyCoursesQueryType,
  InstructorCourseListResType,
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
    }),
  mine: (query?: Partial<GetMyCoursesQueryType>) =>
    http.get<InstructorCourseListResType>(`/courses/mine${toQueryString(query)}`)
}

export default courseApiRequest
