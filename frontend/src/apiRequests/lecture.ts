import http from '@/lib/http'
import { LectureCompleteResType, LectureResType } from '@/schemaValidations/lecture.schema'

export const lectureApiRequest = {
  getDetail: (id: number) => http.get<LectureResType>(`/lectures/${id}`),
  complete: (id: number) => http.post<LectureCompleteResType>(`/lectures/${id}/complete`, null),
  uncomplete: (id: number) => http.delete<LectureCompleteResType>(`/lectures/${id}/complete`)
}

export default lectureApiRequest
