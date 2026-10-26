import http from '@/lib/http'
import { MessageResType } from '@/schemaValidations/common.schema'
import {
  CreateLectureBodyType,
  InstructorLectureResType,
  LectureCompleteResType,
  LectureResType,
  ReorderLecturesBodyType,
  UpdateLectureBodyType
} from '@/schemaValidations/lecture.schema'

export const lectureApiRequest = {
  getDetail: (id: number) => http.get<LectureResType>(`/lectures/${id}`),
  complete: (id: number) => http.post<LectureCompleteResType>(`/lectures/${id}/complete`, null),
  uncomplete: (id: number) => http.delete<LectureCompleteResType>(`/lectures/${id}/complete`),

  // ===== Giảng viên soạn bài =====
  create: (body: CreateLectureBodyType) => http.post<InstructorLectureResType>('/lectures', body),
  update: (id: number, body: UpdateLectureBodyType) => http.put<InstructorLectureResType>(`/lectures/${id}`, body),
  delete: (id: number) => http.delete<MessageResType>(`/lectures/${id}`),
  reorder: (body: ReorderLecturesBodyType) => http.put<MessageResType>('/lectures/reorder', body)
}

export default lectureApiRequest
