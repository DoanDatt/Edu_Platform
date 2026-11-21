import z from 'zod'

// ===== Học viên làm bài: GET /lectures/:id/quiz (KHÔNG có đáp án đúng) =====

export const QuizAttemptSummarySchema = z.object({
  score: z.number(), // 0–100
  correctCount: z.number(),
  totalQuestion: z.number(),
  passed: z.boolean(),
  createdAt: z.string()
})

export const LearnerQuizRes = z.object({
  data: z.object({
    passPercent: z.number(), // đúng từ chừng này % trở lên là đạt (backend: 70)
    questions: z.array(z.object({ id: z.number(), question: z.string(), options: z.array(z.string()) })),
    lastAttempt: QuizAttemptSummarySchema.nullable(), // chưa làm lần nào → null
    bestScore: z.number().nullable()
  }),
  message: z.string()
})
export type LearnerQuizResType = z.infer<typeof LearnerQuizRes>
export type LearnerQuizQuestionType = LearnerQuizResType['data']['questions'][number]

// POST /lectures/:id/quiz/attempts: gửi theo questionId (giảng viên đổi thứ tự câu cũng không chấm nhầm)
export const SubmitQuizBody = z.object({
  answers: z.array(z.object({ questionId: z.number(), selectedIndex: z.number() }))
})
export type SubmitQuizBodyType = z.infer<typeof SubmitQuizBody>

export const SubmitQuizRes = z.object({
  data: z.object({
    score: z.number(),
    correctCount: z.number(),
    totalQuestion: z.number(),
    passed: z.boolean(),
    passPercent: z.number(),
    // Nộp xong mới biết đáp án đúng + giải thích của từng câu
    results: z.array(
      z.object({
        questionId: z.number(),
        selectedIndex: z.number(),
        correctIndex: z.number(),
        isCorrect: z.boolean(),
        explanation: z.string()
      })
    )
  }),
  message: z.string()
})
export type SubmitQuizResType = z.infer<typeof SubmitQuizRes>

// ===== Giảng viên soạn: GET /lectures/:id/quiz/edit (CÓ đáp án đúng), PUT /lectures/:id/quiz =====

export const EditorQuizRes = z.object({
  data: z.array(
    z.object({
      id: z.number(),
      question: z.string(),
      options: z.array(z.string()),
      correctIndex: z.number(),
      explanation: z.string()
    })
  ),
  message: z.string()
})
export type EditorQuizResType = z.infer<typeof EditorQuizRes>

// Giới hạn khớp backend (quiz.schema.ts): tối đa 20 câu, mỗi câu 2–6 lựa chọn
export const MAX_QUIZ_QUESTIONS = 20
export const MIN_QUIZ_OPTIONS = 2
export const MAX_QUIZ_OPTIONS = 6

// Form soạn quiz. options là mảng object { value } (useFieldArray của react-hook-form cần object, không nhận chuỗi trần);
// lúc gửi đổi về mảng chuỗi
export const QuizQuestionFormSchema = z
  .object({
    question: z.string().trim().min(1, 'Vui lòng nhập câu hỏi').max(1000, 'Tối đa 1000 ký tự'),
    options: z
      .array(z.object({ value: z.string().trim().min(1, 'Lựa chọn không được để trống').max(300, 'Tối đa 300 ký tự') }))
      .min(MIN_QUIZ_OPTIONS, `Cần ít nhất ${MIN_QUIZ_OPTIONS} lựa chọn`)
      .max(MAX_QUIZ_OPTIONS, `Tối đa ${MAX_QUIZ_OPTIONS} lựa chọn`),
    correctIndex: z.number().int().min(0),
    explanation: z.string().trim().max(2000, 'Tối đa 2000 ký tự')
  })
  .refine((q) => q.correctIndex < q.options.length, {
    message: 'Chọn đáp án đúng',
    path: ['correctIndex']
  })

export const QuizFormSchema = z.object({
  questions: z.array(QuizQuestionFormSchema).max(MAX_QUIZ_QUESTIONS, `Tối đa ${MAX_QUIZ_QUESTIONS} câu hỏi`)
})
export type QuizFormType = z.infer<typeof QuizFormSchema>

export type SaveQuizBodyType = {
  questions: { question: string; options: string[]; correctIndex: number; explanation?: string }[]
}
