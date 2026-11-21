import http from '@/lib/http'
import {
  EditorQuizResType,
  LearnerQuizResType,
  SaveQuizBodyType,
  SubmitQuizBodyType,
  SubmitQuizResType
} from '@/schemaValidations/quiz.schema'

// Quiz cuối bài (trắc nghiệm, 1 đáp án đúng mỗi câu)
const quizApiRequest = {
  // Học viên đã ghi danh: đề bài (không có đáp án) + lần làm gần nhất + điểm cao nhất
  getForLearner: (lectureId: number) => http.get<LearnerQuizResType>(`/lectures/${lectureId}/quiz`),
  submit: (lectureId: number, body: SubmitQuizBodyType) =>
    http.post<SubmitQuizResType>(`/lectures/${lectureId}/quiz/attempts`, body),

  // Giảng viên của khóa: bộ câu hỏi đầy đủ (có đáp án đúng, giải thích) để soạn; lưu là thay CẢ BỘ
  getForEditor: (lectureId: number) => http.get<EditorQuizResType>(`/lectures/${lectureId}/quiz/edit`),
  save: (lectureId: number, body: SaveQuizBodyType) => http.put<EditorQuizResType>(`/lectures/${lectureId}/quiz`, body)
}

export default quizApiRequest
