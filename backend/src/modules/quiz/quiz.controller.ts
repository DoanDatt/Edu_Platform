import { Request, Response } from 'express'
import * as quizService from './quiz.service'
import { LectureParamsType } from '../lecture/lecture.schema'
import { SaveQuizBodyType, SubmitQuizBodyType } from './quiz.schema'

export const getQuizForEditor = async (req: Request, res: Response) => {
  const { lectureId } = req.params as unknown as LectureParamsType
  const questions = await quizService.getQuizForEditor(lectureId, req.user!.userId)
  res.json({ message: 'Lấy bộ câu hỏi thành công', data: questions })
}

export const saveQuiz = async (req: Request, res: Response) => {
  const { lectureId } = req.params as unknown as LectureParamsType
  const questions = await quizService.saveQuiz(lectureId, req.user!.userId, req.body as SaveQuizBodyType)
  res.json({ message: 'Đã lưu bộ câu hỏi', data: questions })
}

export const getQuizForLearner = async (req: Request, res: Response) => {
  const { lectureId } = req.params as unknown as LectureParamsType
  const quiz = await quizService.getQuizForLearner(lectureId, req.user!.userId)
  res.json({ message: 'Lấy bài tập thành công', data: quiz })
}

export const submitQuiz = async (req: Request, res: Response) => {
  const { lectureId } = req.params as unknown as LectureParamsType
  const result = await quizService.submitQuiz(lectureId, req.user!.userId, req.body as SubmitQuizBodyType)
  res.status(201).json({ message: 'Đã nộp bài', data: result })
}
