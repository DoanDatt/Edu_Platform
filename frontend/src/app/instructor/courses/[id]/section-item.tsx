'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Field, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { formatClock } from '@/lib/format'
import { handleErrorApi, moveItem } from '@/lib/utils'
import { useDeleteLectureMutation, useReorderLecturesMutation } from '@/queries/useLecture'
import { useDeleteSectionMutation, useUpdateSectionMutation } from '@/queries/useSection'
import {
  InstructorLectureType,
  InstructorSectionType,
  UpdateSectionBody,
  UpdateSectionBodyType
} from '@/schemaValidations/section.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useIsMutating } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, FileText, Loader2, MoreHorizontal, Pencil, PlayCircle, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

type SectionItemProps = {
  section: InstructorSectionType
  index: number
  isFirst: boolean
  isLast: boolean
  editable: boolean
  onMove: (direction: -1 | 1) => void
  onAddLecture: () => void
  onEditLecture: (lecture: InstructorLectureType) => void
}

// 1 chương: tiêu đề (đổi tên, lên / xuống, xóa) + danh sách bài giảng + nút thêm bài
export default function SectionItem({
  section,
  index,
  isFirst,
  isLast,
  editable,
  onMove,
  onAddLecture,
  onEditLecture
}: SectionItemProps) {
  const [isRenaming, setIsRenaming] = useState(false)
  const updateSectionMutation = useUpdateSectionMutation()
  const deleteSectionMutation = useDeleteSectionMutation()
  const reorderLecturesMutation = useReorderLecturesMutation()
  const deleteLectureMutation = useDeleteLectureMutation()
  // Đang có BẤT KỲ mutation nào chạy (ở chương này hay chương khác) → khóa các nút đổi thứ tự / xóa.
  // Tránh bấm "lên" 2 lần liên tiếp: lần 2 gửi thứ tự dựa trên dữ liệu cũ (chưa tải lại xong)
  const isBusy = useIsMutating() > 0

  const renameSection = async (title: string) => {
    await updateSectionMutation.mutateAsync({ id: section.id, body: { title } })
    setIsRenaming(false)
  }

  const deleteSection = async () => {
    const message =
      section.lectures.length > 0
        ? `Xóa chương "${section.title}" và ${section.lectures.length} bài giảng bên trong?`
        : `Xóa chương "${section.title}"?`
    if (!confirm(message)) return
    try {
      const result = await deleteSectionMutation.mutateAsync(section.id)
      toast.success(result.payload.message)
    } catch (error) {
      // Ví dụ 409: khóa đã xuất bản phải còn ít nhất 1 bài giảng
      handleErrorApi({ error })
    }
  }

  const moveLecture = async (lectureIndex: number, direction: -1 | 1) => {
    const ids = section.lectures.map((lecture) => lecture.id)
    try {
      await reorderLecturesMutation.mutateAsync({
        sectionId: section.id,
        lectureIds: moveItem(ids, lectureIndex, lectureIndex + direction)
      })
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  const deleteLecture = async (lecture: InstructorLectureType) => {
    if (!confirm(`Xóa bài giảng "${lecture.title}"?`)) return
    try {
      const result = await deleteLectureMutation.mutateAsync(lecture.id)
      toast.success(result.payload.message)
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  return (
    <section className='overflow-hidden rounded-xl border'>
      {/* ===== Tiêu đề chương ===== */}
      <div className='flex items-center gap-3 bg-muted/40 px-4 py-3'>
        {isRenaming ? (
          <div className='flex-1'>
            <TitleForm
              defaultValue={section.title}
              submitLabel='Lưu'
              onSubmit={renameSection}
              onCancel={() => setIsRenaming(false)}
            />
          </div>
        ) : (
          <>
            <h2 className='min-w-0 flex-1 font-semibold'>
              <span className='text-muted-foreground'>Chương {index + 1}:</span> {section.title}
            </h2>
            {editable && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='icon-sm' aria-label={`Thao tác với chương ${section.title}`}>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onSelect={() => setIsRenaming(true)}>
                    <Pencil />
                    Đổi tên
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={isFirst || isBusy} onSelect={() => onMove(-1)}>
                    <ArrowUp />
                    Chuyển lên
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={isLast || isBusy} onSelect={() => onMove(1)}>
                    <ArrowDown />
                    Chuyển xuống
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant='destructive' disabled={isBusy} onSelect={deleteSection}>
                    <Trash2 />
                    Xóa chương
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        )}
      </div>

      {/* ===== Bài giảng ===== */}
      {section.lectures.length === 0 ? (
        <p className='px-4 py-4 text-sm text-muted-foreground'>Chương này chưa có bài giảng.</p>
      ) : (
        <ol className='divide-y'>
          {section.lectures.map((lecture, lectureIndex) => (
            <li key={lecture.id} className='flex items-center gap-3 px-4 py-2.5'>
              {/* Có video: icon play; chưa có: icon tài liệu (bài chỉ có nội dung chữ / chưa tải video) */}
              {lecture.videoUrl ? (
                <PlayCircle className='size-4 shrink-0 text-muted-foreground' />
              ) : (
                <FileText className='size-4 shrink-0 text-muted-foreground' />
              )}
              <span className='min-w-0 flex-1 truncate text-sm'>
                {lectureIndex + 1}. {lecture.title}
              </span>
              {lecture.isPreview && <Badge variant='secondary'>Xem thử</Badge>}
              {!lecture.videoUrl && (
                <Badge variant='outline' className='hidden sm:inline-flex'>
                  Chưa có video
                </Badge>
              )}
              <span className='text-xs tabular-nums text-muted-foreground'>{formatClock(lecture.durationSec)}</span>
              {editable && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon-xs' aria-label={`Thao tác với bài ${lecture.title}`}>
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem onSelect={() => onEditLecture(lecture)}>
                      <Pencil />
                      Sửa bài giảng
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={lectureIndex === 0 || isBusy}
                      onSelect={() => moveLecture(lectureIndex, -1)}
                    >
                      <ArrowUp />
                      Chuyển lên
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={lectureIndex === section.lectures.length - 1 || isBusy}
                      onSelect={() => moveLecture(lectureIndex, 1)}
                    >
                      <ArrowDown />
                      Chuyển xuống
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant='destructive' disabled={isBusy} onSelect={() => deleteLecture(lecture)}>
                      <Trash2 />
                      Xóa bài giảng
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </li>
          ))}
        </ol>
      )}

      {editable && (
        <div className='border-t px-4 py-2'>
          <Button variant='ghost' size='sm' onClick={onAddLecture}>
            <Plus />
            Thêm bài giảng
          </Button>
        </div>
      )}
    </section>
  )
}

// Form 1 ô "tên chương": dùng cho THÊM chương (ở cuối trang) và ĐỔI TÊN chương (ngay tại tiêu đề).
// onSubmit do nơi dùng truyền vào: form này chỉ lo nhập + kiểm tra + hiện lỗi
export function TitleForm({
  defaultValue = '',
  placeholder,
  submitLabel,
  onSubmit,
  onCancel
}: {
  defaultValue?: string
  placeholder?: string
  submitLabel: string
  onSubmit: (title: string) => Promise<void>
  onCancel?: () => void
}) {
  const form = useForm<UpdateSectionBodyType>({
    resolver: zodResolver(UpdateSectionBody),
    defaultValues: { title: defaultValue }
  })

  const handleSubmit = async ({ title }: UpdateSectionBodyType) => {
    try {
      await onSubmit(title)
      form.reset() // về giá trị mặc định: thêm chương xong thì ô trống lại để thêm tiếp
    } catch (error) {
      handleErrorApi({ error, setError: form.setError })
    }
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(handleSubmit)} className='flex flex-wrap items-start gap-2'>
      <Controller
        name='title'
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className='min-w-48 flex-1'>
            <Input
              {...field}
              placeholder={placeholder}
              aria-label='Tên chương'
              aria-invalid={fieldState.invalid}
              // Đổi tên: mở ra là gõ được ngay. Esc = hủy
              autoFocus={Boolean(onCancel)}
              onKeyDown={(e) => e.key === 'Escape' && onCancel?.()}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Button type='submit' disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <Loader2 className='animate-spin' />}
        {submitLabel}
      </Button>
      {onCancel && (
        <Button type='button' variant='ghost' onClick={onCancel}>
          Hủy
        </Button>
      )}
    </form>
  )
}
