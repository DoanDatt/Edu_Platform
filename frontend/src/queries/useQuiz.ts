import quizApiRequest from '@/apiRequests/quiz'
import { SaveQuizBodyType, SubmitQuizBodyType } from '@/schemaValidations/quiz.schema'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// ===== Học viên =====

// enabled: chỉ gọi khi bài có quiz (lecture.hasQuiz) → bài không có quiz không tốn request
export const useLearnerQuizQuery = (lectureId: number, enabled: boolean) => {
  return useQuery({
    queryKey: ['quiz', 'learner', lectureId],
    queryFn: () => quizApiRequest.getForLearner(lectureId),
    enabled
  })
}

// Nộp bài → tải lại đề (lần làm gần nhất, điểm cao nhất) + mục lục trang học (dấu "đã đạt" bài tập)
export const useSubmitQuizMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ lectureId, body }: { lectureId: number; body: SubmitQuizBodyType }) =>
      quizApiRequest.submit(lectureId, body),
    onSuccess: (_res, { lectureId }) => {
      queryClient.invalidateQueries({ queryKey: ['quiz', 'learner', lectureId] })
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
    }
  })
}

// ===== Giảng viên =====

export const useEditorQuizQuery = (lectureId: number) => {
  return useQuery({
    queryKey: ['quiz', 'editor', lectureId],
    queryFn: () => quizApiRequest.getForEditor(lectureId)
  })
}

// Lưu cả bộ → tải lại bản soạn + mọi chỗ hiện "bài có quiz không" (trang học cache ở ['lectures'])
export const useSaveQuizMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ lectureId, body }: { lectureId: number; body: SaveQuizBodyType }) =>
      quizApiRequest.save(lectureId, body),
    onSuccess: (_res, { lectureId }) => {
      queryClient.invalidateQueries({ queryKey: ['quiz'] })
      queryClient.invalidateQueries({ queryKey: ['lectures', lectureId] })
    }
  })
}
