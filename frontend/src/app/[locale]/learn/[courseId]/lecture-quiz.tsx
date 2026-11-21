'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { HttpError } from '@/lib/http'
import { cn, handleErrorApi } from '@/lib/utils'
import { useLearnerQuizQuery, useSubmitQuizMutation } from '@/queries/useQuiz'
import { LearnerQuizQuestionType, SubmitQuizResType } from '@/schemaValidations/quiz.schema'
import { CheckCircle2, ClipboardCheck, Loader2, RotateCcw, XCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

type QuizResult = SubmitQuizResType['data']

// Bài tập trắc nghiệm cuối bài, nằm dưới video ở trang học. 3 bước:
//   intro  → số câu, điểm đạt, kết quả lần trước, nút Làm bài
//   doing  → chọn đáp án từng câu (phải trả lời đủ mới nộp được)
//   result → điểm, đạt / chưa đạt, từng câu đúng sai + đáp án đúng + giải thích (backend chỉ trả sau khi nộp)
// key={lectureId} ở chỗ dùng: đổi bài thì mọi state về đầu
export default function LectureQuiz({ lectureId }: { lectureId: number }) {
  const quizQuery = useLearnerQuizQuery(lectureId, true)
  const submitMutation = useSubmitQuizMutation()
  const [step, setStep] = useState<'intro' | 'doing' | 'result'>('intro')
  // Đáp án đang chọn: { [questionId]: vị trí lựa chọn }
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [result, setResult] = useState<QuizResult | null>(null)

  const quiz = quizQuery.data?.payload.data
  if (quizQuery.isLoading) return <Skeleton className='m-4 h-28 md:m-6' />
  // Lỗi / bài không còn câu hỏi (giảng viên vừa bỏ quiz) → không hiện khối bài tập
  if (!quiz || quiz.questions.length === 0) return null

  const answeredCount = quiz.questions.filter((q) => answers[q.id] !== undefined).length
  const allAnswered = answeredCount === quiz.questions.length

  const start = () => {
    setAnswers({})
    setResult(null)
    setStep('doing')
  }

  const submit = async () => {
    if (!allAnswered || submitMutation.isPending) return
    try {
      const res = await submitMutation.mutateAsync({
        lectureId,
        body: { answers: quiz.questions.map((q) => ({ questionId: q.id, selectedIndex: answers[q.id] })) }
      })
      setResult(res.payload.data)
      setStep('result')
    } catch (error) {
      // 409: giảng viên vừa sửa bộ câu hỏi trong lúc đang làm → tải đề mới, làm lại từ đầu
      if (error instanceof HttpError && error.status === 409) {
        toast.error(error.payload.message)
        await quizQuery.refetch()
        setStep('intro')
        return
      }
      handleErrorApi({ error })
    }
  }

  return (
    <section className='flex flex-col gap-4 border-t p-4 md:p-6' aria-labelledby='quiz-heading'>
      <div className='flex flex-wrap items-center gap-2'>
        <ClipboardCheck className='size-5 text-primary' />
        <h3 id='quiz-heading' className='font-semibold'>
          Bài tập
        </h3>
        <span className='text-sm text-muted-foreground'>
          {quiz.questions.length} câu · đạt từ {quiz.passPercent}%
        </span>
        {quiz.lastAttempt?.passed && <Badge className='bg-green-600 text-white'>Đã đạt</Badge>}
      </div>

      {step === 'intro' && (
        <div className='flex flex-wrap items-center gap-4 rounded-lg bg-muted/50 p-4'>
          {quiz.lastAttempt ? (
            <p className='text-sm'>
              Lần gần nhất: <span className='font-semibold'>{quiz.lastAttempt.score}%</span> (
              {quiz.lastAttempt.correctCount}/{quiz.lastAttempt.totalQuestion} câu đúng)
              {quiz.bestScore !== null && (
                <>
                  {' '}
                  · Cao nhất: <span className='font-semibold'>{quiz.bestScore}%</span>
                </>
              )}
            </p>
          ) : (
            <p className='text-sm text-muted-foreground'>
              Làm bài để kiểm tra lại kiến thức vừa học. Làm lại bao nhiêu lần cũng được.
            </p>
          )}
          <Button onClick={start} className='ml-auto'>
            {quiz.lastAttempt ? <RotateCcw /> : <ClipboardCheck />}
            {quiz.lastAttempt ? 'Làm lại' : 'Làm bài'}
          </Button>
        </div>
      )}

      {step === 'doing' && (
        <>
          <ol className='flex flex-col gap-4'>
            {quiz.questions.map((question, index) => (
              <QuestionBlock
                key={question.id}
                index={index}
                question={question}
                selected={answers[question.id]}
                onSelect={(optionIndex) => setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))}
              />
            ))}
          </ol>
          <div className='flex flex-wrap items-center gap-3'>
            <span className='text-sm text-muted-foreground' aria-live='polite'>
              Đã trả lời {answeredCount}/{quiz.questions.length} câu
            </span>
            <div className='ml-auto flex gap-2'>
              <Button variant='outline' onClick={() => setStep('intro')} disabled={submitMutation.isPending}>
                Hủy
              </Button>
              <Button onClick={submit} disabled={!allAnswered || submitMutation.isPending}>
                {submitMutation.isPending && <Loader2 className='animate-spin' />}
                Nộp bài
              </Button>
            </div>
          </div>
        </>
      )}

      {step === 'result' && result && (
        <>
          <div
            className={cn(
              'flex flex-wrap items-center gap-4 rounded-lg p-4',
              result.passed ? 'bg-green-600/10' : 'bg-destructive/10'
            )}
            role='status'
          >
            <p className={cn('font-heading text-4xl font-bold', result.passed ? 'text-green-600' : 'text-destructive')}>
              {result.score}%
            </p>
            <div className='flex flex-col'>
              <span className='font-semibold'>{result.passed ? 'Đạt! Làm tốt lắm' : 'Chưa đạt'}</span>
              <span className='text-sm text-muted-foreground'>
                Đúng {result.correctCount}/{result.totalQuestion} câu · cần {result.passPercent}% để đạt
              </span>
            </div>
            <Button onClick={start} variant='outline' className='ml-auto'>
              <RotateCcw />
              Làm lại
            </Button>
          </div>
          <ol className='flex flex-col gap-4'>
            {quiz.questions.map((question, index) => (
              <QuestionBlock
                key={question.id}
                index={index}
                question={question}
                selected={answers[question.id]}
                review={result.results.find((r) => r.questionId === question.id)}
              />
            ))}
          </ol>
        </>
      )}
    </section>
  )
}

// 1 câu hỏi. Có review = đang xem kết quả: khóa lựa chọn, tô xanh đáp án đúng, tô đỏ lựa chọn sai
function QuestionBlock({
  index,
  question,
  selected,
  onSelect,
  review
}: {
  index: number
  question: LearnerQuizQuestionType
  selected: number | undefined
  onSelect?: (optionIndex: number) => void
  review?: QuizResult['results'][number]
}) {
  return (
    <li>
      {/* fieldset + legend: trình đọc màn hình đọc câu hỏi khi đi qua từng lựa chọn */}
      <fieldset className='flex flex-col gap-2' disabled={Boolean(review)}>
        <legend className='mb-2 font-medium'>
          Câu {index + 1}. {question.question}
        </legend>
        {question.options.map((option, optionIndex) => {
          const isSelected = selected === optionIndex
          const isCorrectOption = review?.correctIndex === optionIndex
          const isWrongChoice = review && isSelected && !review.isCorrect
          return (
            <label
              key={optionIndex}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                !review && 'hover:bg-muted',
                !review && isSelected && 'border-primary bg-primary/5',
                isCorrectOption && 'border-green-600 bg-green-600/10',
                isWrongChoice && 'border-destructive bg-destructive/10',
                review && 'cursor-default'
              )}
            >
              <input
                type='radio'
                name={`question-${question.id}`}
                checked={isSelected}
                onChange={() => onSelect?.(optionIndex)}
                className='size-4 accent-primary'
              />
              <span className='flex-1'>{option}</span>
              {isCorrectOption && <CheckCircle2 className='size-4 shrink-0 text-green-600' aria-label='Đáp án đúng' />}
              {isWrongChoice && <XCircle className='size-4 shrink-0 text-destructive' aria-label='Bạn chọn sai' />}
            </label>
          )
        })}
        {review?.explanation && (
          <p className='rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground'>
            <span className='font-medium text-foreground'>Giải thích: </span>
            {review.explanation}
          </p>
        )}
      </fieldset>
    </li>
  )
}
