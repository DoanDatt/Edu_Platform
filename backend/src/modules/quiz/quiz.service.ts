import prisma from '../../lib/prisma'
import { HttpError } from '../../utils/error'
import { getLectureOfEnrolledCourse } from '../enrollment/enrollment.service'
import { getEditableOwnLecture } from '../lecture/lecture.service'
import { SaveQuizBodyType, SubmitQuizBodyType } from './quiz.schema'

// Đúng từ 70% số câu trở lên là đạt
export const QUIZ_PASS_PERCENT = 70

const questionOrder = [{ position: 'asc' as const }, { id: 'asc' as const }]

// ===== Giảng viên =====

// Bộ câu hỏi ĐẦY ĐỦ (kèm đáp án đúng) để soạn
export const getQuizForEditor = async (lectureId: number, instructorId: number) => {
  await getEditableOwnLecture(lectureId, instructorId) // 404 / 403 / 409
  return prisma.quizQuestion.findMany({ where: { lectureId }, orderBy: questionOrder })
}

// Lưu cả bộ: xóa bộ cũ, tạo bộ mới theo đúng thứ tự gửi lên (trong 1 transaction).
// Lượt làm cũ của học viên vẫn giữ (điểm đã chấm không đổi)
export const saveQuiz = async (lectureId: number, instructorId: number, { questions }: SaveQuizBodyType) => {
  await getEditableOwnLecture(lectureId, instructorId)
  await prisma.$transaction([
    prisma.quizQuestion.deleteMany({ where: { lectureId } }),
    prisma.quizQuestion.createMany({
      data: questions.map((q, index) => ({ ...q, explanation: q.explanation ?? '', lectureId, position: index })),
    }),
  ])
  return prisma.quizQuestion.findMany({ where: { lectureId }, orderBy: questionOrder })
}

// ===== Học viên =====

const attemptSummary = { score: true, correctCount: true, totalQuestion: true, passed: true, createdAt: true }

// Đề bài (KHÔNG kèm đáp án đúng) + kết quả lần làm gần nhất + điểm cao nhất
export const getQuizForLearner = async (lectureId: number, userId: number) => {
  await getLectureOfEnrolledCourse(lectureId, userId) // 404 / 403
  const [questions, lastAttempt, best] = await Promise.all([
    prisma.quizQuestion.findMany({
      where: { lectureId },
      orderBy: questionOrder,
      select: { id: true, question: true, options: true },
    }),
    prisma.quizAttempt.findFirst({
      where: { lectureId, userId },
      orderBy: { createdAt: 'desc' },
      select: attemptSummary,
    }),
    prisma.quizAttempt.aggregate({ where: { lectureId, userId }, _max: { score: true } }),
  ])
  return { passPercent: QUIZ_PASS_PERCENT, questions, lastAttempt, bestScore: best._max.score }
}

// Nộp bài: chấm ngay, lưu lượt làm, trả từng câu đúng / sai kèm đáp án đúng và giải thích
export const submitQuiz = async (lectureId: number, userId: number, { answers }: SubmitQuizBodyType) => {
  await getLectureOfEnrolledCourse(lectureId, userId)
  const questions = await prisma.quizQuestion.findMany({ where: { lectureId }, orderBy: questionOrder })
  if (questions.length === 0) {
    throw new HttpError(404, 'Bài giảng này không có bài tập')
  }

  const selectedById = new Map(answers.map((a) => [a.questionId, a.selectedIndex]))
  // Câu hỏi không còn (giảng viên vừa sửa bộ câu hỏi trong lúc học viên đang làm) → bắt tải lại đề
  const questionIds = new Set(questions.map((q) => q.id))
  if (answers.some((a) => !questionIds.has(a.questionId))) {
    throw new HttpError(409, 'Bộ câu hỏi vừa được cập nhật, vui lòng tải lại bài tập')
  }
  if (questions.some((q) => !selectedById.has(q.id))) {
    throw new HttpError(422, 'Vui lòng trả lời tất cả câu hỏi')
  }

  const results = questions.map((q) => {
    const selectedIndex = selectedById.get(q.id)!
    return {
      questionId: q.id,
      selectedIndex,
      correctIndex: q.correctIndex,
      isCorrect: selectedIndex === q.correctIndex,
      explanation: q.explanation,
    }
  })
  const correctCount = results.filter((r) => r.isCorrect).length
  const score = Math.round((correctCount * 100) / questions.length)
  const passed = score >= QUIZ_PASS_PERCENT

  await prisma.quizAttempt.create({
    data: {
      userId,
      lectureId,
      score,
      correctCount,
      totalQuestion: questions.length,
      passed,
      answers: results.map(({ questionId, selectedIndex }) => ({ questionId, selectedIndex })),
    },
  })
  return { score, correctCount, totalQuestion: questions.length, passed, passPercent: QUIZ_PASS_PERCENT, results }
}
