import z from 'zod'

// 1 câu hỏi trắc nghiệm, 1 đáp án đúng
const QuizQuestionBodySchema = z
  .object({
    question: z.string().trim().min(1, 'Vui lòng nhập câu hỏi').max(1000),
    options: z
      .array(z.string().trim().min(1, 'Lựa chọn không được để trống').max(300))
      .min(2, 'Cần ít nhất 2 lựa chọn')
      .max(6, 'Tối đa 6 lựa chọn'),
    // Vị trí đáp án đúng trong options (bắt đầu từ 0)
    correctIndex: z.number().int().min(0),
    explanation: z.string().trim().max(2000).optional(),
  })
  .strict()
  .refine((q) => q.correctIndex < q.options.length, {
    message: 'Đáp án đúng phải là một trong các lựa chọn',
    path: ['correctIndex'],
  })

// PUT /lectures/:lectureId/quiz: giảng viên lưu CẢ BỘ câu hỏi 1 lần (thay hết bộ cũ).
// Mảng rỗng = bỏ quiz của bài này
export const SaveQuizBodySchema = z
  .object({
    questions: z.array(QuizQuestionBodySchema).max(20, 'Tối đa 20 câu hỏi mỗi bài'),
  })
  .strict()

export type SaveQuizBodyType = z.infer<typeof SaveQuizBodySchema>

// POST /lectures/:lectureId/quiz/attempts: học viên nộp bài, mỗi câu 1 đáp án.
// Gửi theo questionId (không theo thứ tự) → giảng viên có đổi thứ tự câu hỏi cũng không chấm nhầm
export const SubmitQuizBodySchema = z
  .object({
    answers: z
      .array(
        z
          .object({
            questionId: z.number().int().positive(),
            selectedIndex: z.number().int().min(0),
          })
          .strict(),
      )
      .min(1, 'Vui lòng trả lời câu hỏi'),
  })
  .strict()

export type SubmitQuizBodyType = z.infer<typeof SubmitQuizBodySchema>
