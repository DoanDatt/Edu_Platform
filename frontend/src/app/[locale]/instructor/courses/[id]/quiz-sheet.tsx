'use client'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { HttpError } from '@/lib/http'
import { handleErrorApi } from '@/lib/utils'
import { useEditorQuizQuery, useSaveQuizMutation } from '@/queries/useQuiz'
import {
  EditorQuizResType,
  MAX_QUIZ_OPTIONS,
  MAX_QUIZ_QUESTIONS,
  MIN_QUIZ_OPTIONS,
  QuizFormSchema,
  QuizFormType
} from '@/schemaValidations/quiz.schema'
import { InstructorLectureType } from '@/schemaValidations/section.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Control, Controller, useFieldArray, useForm, UseFormSetValue, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

// Khung trượt soạn bài tập trắc nghiệm cho 1 bài giảng. Lưu là thay CẢ BỘ câu hỏi (PUT /lectures/:id/quiz).
// Xóa hết câu hỏi rồi lưu = bỏ bài tập của bài này
export default function QuizSheet({
  lecture,
  onClose
}: {
  lecture: InstructorLectureType | null
  onClose: () => void
}) {
  // Giữ bài cuối cùng trong lúc Sheet trượt ra (giống LectureSheet), khỏi trống nội dung
  const [lastLecture, setLastLecture] = useState(lecture)
  if (lecture && lecture !== lastLecture) setLastLecture(lecture)
  const current = lecture ?? lastLecture

  return (
    <Sheet open={lecture !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-2xl'>
        <SheetHeader>
          <SheetTitle>Bài tập trắc nghiệm</SheetTitle>
          <SheetDescription>{current?.title}. Mỗi câu 1 đáp án đúng, học viên đúng từ 70% là đạt.</SheetDescription>
        </SheetHeader>
        {/* key: mở bài khác → tải và dựng form mới */}
        {current && <QuizEditor key={current.id} lectureId={current.id} onDone={onClose} />}
      </SheetContent>
    </Sheet>
  )
}

// Tải bộ câu hỏi đang có (kèm đáp án đúng) rồi mới dựng form, để defaultValues có dữ liệu thật
function QuizEditor({ lectureId, onDone }: { lectureId: number; onDone: () => void }) {
  const quizQuery = useEditorQuizQuery(lectureId)

  if (quizQuery.isLoading) {
    return (
      <div className='flex flex-col gap-3 px-4'>
        <Skeleton className='h-40' />
        <Skeleton className='h-40' />
      </div>
    )
  }
  if (quizQuery.isError || !quizQuery.data) {
    // 409: khóa đang chờ duyệt, không sửa được
    const message =
      quizQuery.error instanceof HttpError
        ? quizQuery.error.payload.message
        : 'Không tải được bài tập, vui lòng thử lại'
    return <p className='mx-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive'>{message}</p>
  }
  return <QuizForm lectureId={lectureId} initial={quizQuery.data.payload.data} onDone={onDone} />
}

const emptyQuestion = (): QuizFormType['questions'][number] => ({
  question: '',
  options: [{ value: '' }, { value: '' }],
  correctIndex: 0,
  explanation: ''
})

function QuizForm({
  lectureId,
  initial,
  onDone
}: {
  lectureId: number
  initial: EditorQuizResType['data']
  onDone: () => void
}) {
  const saveMutation = useSaveQuizMutation()
  const form = useForm<QuizFormType>({
    resolver: zodResolver(QuizFormSchema),
    defaultValues: {
      // Chưa có quiz → sẵn 1 câu trống cho giảng viên gõ luôn
      questions:
        initial.length > 0
          ? initial.map((q) => ({
              question: q.question,
              options: q.options.map((value) => ({ value })),
              correctIndex: q.correctIndex,
              explanation: q.explanation
            }))
          : [emptyQuestion()]
    }
  })
  const questions = useFieldArray({ control: form.control, name: 'questions' })

  const onSubmit = async (data: QuizFormType) => {
    if (saveMutation.isPending) return
    if (data.questions.length === 0 && initial.length > 0 && !confirm('Xóa toàn bộ bài tập của bài giảng này?')) return
    try {
      await saveMutation.mutateAsync({
        lectureId,
        body: {
          questions: data.questions.map((q) => ({
            question: q.question,
            options: q.options.map((option) => option.value),
            correctIndex: q.correctIndex,
            // Rỗng thì không gửi (backend lưu chuỗi rỗng)
            explanation: q.explanation || undefined
          }))
        }
      })
      toast.success(data.questions.length > 0 ? `Đã lưu ${data.questions.length} câu hỏi` : 'Đã bỏ bài tập của bài này')
      onDone()
    } catch (error) {
      handleErrorApi({ error, setError: form.setError })
    }
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-4 px-4 pb-4'>
      {questions.fields.length === 0 && (
        <p className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>
          Chưa có câu hỏi. Lưu lúc này sẽ bỏ bài tập của bài giảng.
        </p>
      )}

      <ol className='flex flex-col gap-4'>
        {questions.fields.map((field, index) => (
          <QuestionEditor
            key={field.id}
            index={index}
            control={form.control}
            setValue={form.setValue}
            onRemove={() => questions.remove(index)}
          />
        ))}
      </ol>

      <Button
        type='button'
        variant='outline'
        onClick={() => questions.append(emptyQuestion())}
        disabled={questions.fields.length >= MAX_QUIZ_QUESTIONS}
      >
        <Plus />
        Thêm câu hỏi ({questions.fields.length}/{MAX_QUIZ_QUESTIONS})
      </Button>

      <div className='sticky bottom-0 flex justify-end gap-2 border-t bg-background pt-4'>
        <Button type='button' variant='outline' onClick={onDone}>
          Hủy
        </Button>
        <Button type='submit' disabled={saveMutation.isPending}>
          {saveMutation.isPending && <Loader2 className='animate-spin' />}
          Lưu bài tập
        </Button>
      </div>
    </form>
  )
}

// 1 câu hỏi: nội dung, các lựa chọn (radio = đáp án đúng), giải thích.
// Tách component riêng vì mỗi câu cần useFieldArray riêng cho danh sách lựa chọn của nó
function QuestionEditor({
  index,
  control,
  setValue,
  onRemove
}: {
  index: number
  control: Control<QuizFormType>
  setValue: UseFormSetValue<QuizFormType>
  onRemove: () => void
}) {
  const options = useFieldArray({ control, name: `questions.${index}.options` })
  const correctIndex = useWatch({ control, name: `questions.${index}.correctIndex` })

  // Xóa 1 lựa chọn → đáp án đúng phải dời theo: xóa ô ĐỨNG TRƯỚC đáp án đúng thì đáp án lùi 1 bậc,
  // xóa CHÍNH đáp án đúng thì tạm chọn ô đầu (giảng viên chọn lại). Không dời thì đáp án trỏ nhầm sang ô khác
  const removeOption = (optionIndex: number) => {
    if (optionIndex < correctIndex) setValue(`questions.${index}.correctIndex`, correctIndex - 1)
    else if (optionIndex === correctIndex) setValue(`questions.${index}.correctIndex`, 0)
    options.remove(optionIndex)
  }

  return (
    <li className='flex flex-col gap-3 rounded-xl border p-4'>
      <div className='flex items-center justify-between gap-2'>
        <span className='font-semibold'>Câu {index + 1}</span>
        <Button type='button' variant='ghost' size='icon-sm' onClick={onRemove} aria-label={`Xóa câu ${index + 1}`}>
          <Trash2 />
        </Button>
      </div>

      <Controller
        name={`questions.${index}.question`}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`q-${index}`}>Câu hỏi</FieldLabel>
            <Textarea {...field} id={`q-${index}`} rows={2} aria-invalid={fieldState.invalid} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <fieldset className='flex flex-col gap-2'>
        <legend className='mb-2 text-sm font-medium'>Lựa chọn (chọn đáp án đúng ở ô tròn)</legend>
        {options.fields.map((option, optionIndex) => (
          <Controller
            key={option.id}
            name={`questions.${index}.options.${optionIndex}.value`}
            control={control}
            render={({ field, fieldState }) => (
              <div className='flex flex-col gap-1'>
                <div className='flex items-center gap-2'>
                  <input
                    type='radio'
                    name={`correct-${index}`}
                    checked={correctIndex === optionIndex}
                    onChange={() => setValue(`questions.${index}.correctIndex`, optionIndex, { shouldDirty: true })}
                    className='size-4 shrink-0 accent-green-600'
                    aria-label={`Đáp án đúng là lựa chọn ${optionIndex + 1}`}
                  />
                  <Input
                    {...field}
                    placeholder={`Lựa chọn ${optionIndex + 1}`}
                    aria-invalid={fieldState.invalid}
                    className={correctIndex === optionIndex ? 'border-green-600' : undefined}
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon-sm'
                    onClick={() => removeOption(optionIndex)}
                    disabled={options.fields.length <= MIN_QUIZ_OPTIONS}
                    aria-label={`Xóa lựa chọn ${optionIndex + 1}`}
                  >
                    <X />
                  </Button>
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} className='pl-6' />}
              </div>
            )}
          />
        ))}
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='w-fit'
          onClick={() => options.append({ value: '' })}
          disabled={options.fields.length >= MAX_QUIZ_OPTIONS}
        >
          <Plus />
          Thêm lựa chọn
        </Button>
      </fieldset>

      <Controller
        name={`questions.${index}.explanation`}
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor={`exp-${index}`}>Giải thích (hiện sau khi học viên nộp bài, không bắt buộc)</FieldLabel>
            <Textarea {...field} id={`exp-${index}`} rows={2} />
          </Field>
        )}
      />
    </li>
  )
}
