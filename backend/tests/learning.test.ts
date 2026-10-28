import { beforeAll, describe, expect, it } from 'vitest'
import {
  Account,
  api,
  bearer,
  createCategory,
  createInstructor,
  createPublishedCourse,
  loginAdmin,
  registerStudent,
  watchLecture,
} from './helpers'

let admin: Account
let instructor: Account
let courseId: number
// Bài 120 giây (cần xem 108 giây) và bài 300 giây, cùng 1 chương
let shortLectureId: number
let longLectureId: number

beforeAll(async () => {
  admin = await loginAdmin()
  instructor = await createInstructor(admin)
  const categoryId = await createCategory(admin)
  const course = await createPublishedCourse(instructor, admin, { categoryId })
  courseId = course.courseId
  shortLectureId = course.previewLectureId
  longLectureId = course.lockedLectureId
})

// Học viên mới đã ghi danh khóa (khóa miễn phí)
const enrolledStudent = async () => {
  const student = await registerStudent('learner')
  await api().post('/enrollments').set(bearer(student.token)).send({ courseId }).expect(201)
  return student
}

const getLearning = async (student: Account) =>
  (await api().get(`/enrollments/mine/${courseId}`).set(bearer(student.token)).expect(200)).body.data

const findLecture = (learning: { course: { sections: { lectures: { id: number }[] }[] } }, id: number) =>
  learning.course.sections.flatMap((s) => s.lectures).find((l) => l.id === id)

describe('Xem đủ 90% video mới tính là học xong', () => {
  it('chưa xem thì không đánh dấu được; chưa ghi danh thì không báo tiến độ được', async () => {
    const student = await enrolledStudent()
    const res = await api().post(`/lectures/${shortLectureId}/complete`).set(bearer(student.token)).expect(409)
    expect(res.body.message).toContain('90%')

    const outsider = await registerStudent('outsider')
    await api()
      .put(`/lectures/${shortLectureId}/watch`)
      .set(bearer(outsider.token))
      .send({ playedSec: 10, positionSec: 10 })
      .expect(403)
    await api()
      .put(`/lectures/${shortLectureId}/watch`)
      .set(bearer(student.token))
      .send({ playedSec: -1, positionSec: 0 })
      .expect(422)
  })

  it('báo số giây giả (nhiều hơn thời gian thực) chỉ được cộng vài chục giây', async () => {
    const student = await enrolledStudent()
    const first = await api()
      .put(`/lectures/${shortLectureId}/watch`)
      .set(bearer(student.token))
      .send({ playedSec: 600, positionSec: 120 })
      .expect(200)
    const second = await api()
      .put(`/lectures/${shortLectureId}/watch`)
      .set(bearer(student.token))
      .send({ playedSec: 600, positionSec: 120 })
      .expect(200)
    // Lần đầu tối đa 30 giây × 2 + 5, lần 2 gần như không có thời gian trôi → +5
    expect(first.body.data.watchedSec).toBeLessThanOrEqual(65)
    expect(second.body.data.watchedSec).toBeLessThanOrEqual(70)
    expect(second.body.data.completed).toBe(false)
    expect(second.body.data.requiredSec).toBe(108)
  })

  it('xem đủ → tự hoàn thành, lưu chỗ đang xem; bỏ đánh dấu rồi đánh dấu lại được', async () => {
    const student = await enrolledStudent()
    await watchLecture(student.token, shortLectureId, 110)

    const learning = await getLearning(student)
    expect(findLecture(learning, shortLectureId)).toMatchObject({ completed: true })
    expect(learning.progress.completedLectures).toBe(1)

    // Mở lại bài → biết đang dừng ở giây 110 để xem tiếp
    const lecture = await api().get(`/lectures/${shortLectureId}`).set(bearer(student.token)).expect(200)
    expect(lecture.body.data.watch).toEqual({ watchedSec: 110, positionSec: 110 })
    expect(lecture.body.data.requiredWatchSec).toBe(108)

    await api().delete(`/lectures/${shortLectureId}/complete`).set(bearer(student.token)).expect(200)
    await api().post(`/lectures/${shortLectureId}/complete`).set(bearer(student.token)).expect(200)
  })
})

describe('Quiz cuối bài', () => {
  const questions = [
    { question: '1 + 1 = ?', options: ['1', '2', '3'], correctIndex: 1, explanation: 'Phép cộng cơ bản' },
    { question: 'HTML là gì?', options: ['Ngôn ngữ đánh dấu', 'Ngôn ngữ lập trình'], correctIndex: 0 },
    { question: 'CSS dùng để?', options: ['Lưu dữ liệu', 'Trình bày giao diện', 'Gọi API'], correctIndex: 1 },
  ]

  it('giảng viên soạn quiz: kiểm tra dữ liệu, chỉ chủ khóa mới soạn được', async () => {
    await api()
      .put(`/lectures/${longLectureId}/quiz`)
      .set(bearer(instructor.token))
      .send({ questions: [{ question: 'Sai', options: ['A', 'B'], correctIndex: 2 }] })
      .expect(422)

    const other = await createInstructor(admin)
    await api().put(`/lectures/${longLectureId}/quiz`).set(bearer(other.token)).send({ questions }).expect(403)

    const saved = await api()
      .put(`/lectures/${longLectureId}/quiz`)
      .set(bearer(instructor.token))
      .send({ questions })
      .expect(200)
    expect(saved.body.data).toHaveLength(3)

    const editor = await api().get(`/lectures/${longLectureId}/quiz/edit`).set(bearer(instructor.token)).expect(200)
    expect(editor.body.data[0]).toMatchObject({ question: '1 + 1 = ?', correctIndex: 1 })
  })

  it('học viên: đề không lộ đáp án, chưa ghi danh thì không làm được', async () => {
    const student = await enrolledStudent()
    const quiz = await api().get(`/lectures/${longLectureId}/quiz`).set(bearer(student.token)).expect(200)
    expect(quiz.body.data.questions).toHaveLength(3)
    expect(quiz.body.data.questions[0]).not.toHaveProperty('correctIndex')
    expect(quiz.body.data).toMatchObject({ passPercent: 70, lastAttempt: null, bestScore: null })

    const outsider = await registerStudent('outsider')
    await api().get(`/lectures/${longLectureId}/quiz`).set(bearer(outsider.token)).expect(403)
    // Học viên không xem được bản có đáp án
    await api().get(`/lectures/${longLectureId}/quiz/edit`).set(bearer(student.token)).expect(403)
  })

  it('nộp bài: thiếu câu → 422, câu lạ → 409, 2/3 đúng chưa đạt, 3/3 đạt', async () => {
    const student = await enrolledStudent()
    const quiz = await api().get(`/lectures/${longLectureId}/quiz`).set(bearer(student.token)).expect(200)
    const ids: number[] = quiz.body.data.questions.map((q: { id: number }) => q.id)
    const submit = (answers: { questionId: number; selectedIndex: number }[]) =>
      api().post(`/lectures/${longLectureId}/quiz/attempts`).set(bearer(student.token)).send({ answers })

    await submit([{ questionId: ids[0], selectedIndex: 1 }]).expect(422)
    await submit([{ questionId: 999_999, selectedIndex: 0 }]).expect(409)

    const failed = await submit([
      { questionId: ids[0], selectedIndex: 1 },
      { questionId: ids[1], selectedIndex: 0 },
      { questionId: ids[2], selectedIndex: 0 },
    ]).expect(201)
    expect(failed.body.data).toMatchObject({ score: 67, correctCount: 2, passed: false })
    expect(failed.body.data.results[2]).toMatchObject({ isCorrect: false, correctIndex: 1 })
    expect(failed.body.data.results[0].explanation).toBe('Phép cộng cơ bản')

    const passed = await submit([
      { questionId: ids[0], selectedIndex: 1 },
      { questionId: ids[1], selectedIndex: 0 },
      { questionId: ids[2], selectedIndex: 1 },
    ]).expect(201)
    expect(passed.body.data).toMatchObject({ score: 100, passed: true })

    const again = await api().get(`/lectures/${longLectureId}/quiz`).set(bearer(student.token)).expect(200)
    expect(again.body.data.lastAttempt).toMatchObject({ score: 100, passed: true })
    expect(again.body.data.bestScore).toBe(100)

    // Mục lục trang học: bài có quiz, đã đạt
    const learning = await getLearning(student)
    expect(findLecture(learning, longLectureId)).toMatchObject({ hasQuiz: true, quizPassed: true })
    expect(findLecture(learning, shortLectureId)).toMatchObject({ hasQuiz: false, quizPassed: false })
  })

  it('lưu bộ câu hỏi rỗng = bỏ quiz', async () => {
    await api().put(`/lectures/${longLectureId}/quiz`).set(bearer(instructor.token)).send({ questions: [] }).expect(200)
    const student = await enrolledStudent()
    const quiz = await api().get(`/lectures/${longLectureId}/quiz`).set(bearer(student.token)).expect(200)
    expect(quiz.body.data.questions).toEqual([])
  })
})
