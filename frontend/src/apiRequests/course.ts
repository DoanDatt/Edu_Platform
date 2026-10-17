import http from '@/lib/http'
import { toQueryString } from '@/lib/utils'
import { GetCoursesQueryType, PublicCourseListResType } from '@/schemaValidations/course.schema'

export const courseApiRequest = {
  list: (query?: Partial<GetCoursesQueryType>) => http.get<PublicCourseListResType>(`/courses${toQueryString(query)}`)
}

export default courseApiRequest
