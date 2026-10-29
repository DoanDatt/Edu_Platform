'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { formatClock } from '@/lib/format'
import { handleErrorApi } from '@/lib/utils'
import { useCreateLectureMutation, useUpdateLectureMutation } from '@/queries/useLecture'
import { useUploadVideoMutation } from '@/queries/useUpload'
import { LectureContentSchema, LectureContentType } from '@/schemaValidations/lecture.schema'
import { InstructorLectureType } from '@/schemaValidations/section.schema'
import { MAX_VIDEO_MB, VIDEO_TYPES } from '@/schemaValidations/upload.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

// Có lecture = SỬA bài đó; không có = THÊM bài mới vào chương sectionId
export type LectureTarget = { sectionId: number; lecture?: InstructorLectureType }

// Khung trượt từ bên phải để thêm / sửa bài giảng (form dài: video, thời lượng, nội dung → không nhét vừa 1 dòng)
export default function LectureSheet({ target, onClose }: { target: LectureTarget | null; onClose: () => void }) {
  // Lúc đóng, target về null NGAY nhưng Sheet còn trượt ra mất ~0.3 giây → giữ target cuối cùng để
  // nội dung không bị trống trong lúc trượt. Đổi state ngay khi render: cách React gợi ý cho
  // "state cần chỉnh theo prop", thay vì useEffect (https://react.dev/learn/you-might-not-need-an-effect)
  const [lastTarget, setLastTarget] = useState(target)
  if (target && target !== lastTarget) setLastTarget(target)
  const current = target ?? lastTarget

  return (
    <Sheet open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
        <SheetHeader>
          <SheetTitle>{current?.lecture ? 'Sửa bài giảng' : 'Thêm bài giảng'}</SheetTitle>
          <SheetDescription>Video, thời lượng và nội dung đi kèm của bài.</SheetDescription>
        </SheetHeader>
        {current && (
          // key: mở bài khác → form mới với dữ liệu của bài đó
          <LectureForm key={current.lecture?.id ?? `new-${current.sectionId}`} target={current} onDone={onClose} />
        )}
      </SheetContent>
    </Sheet>
  )
}

// Đọc thời lượng video NGAY TRÊN TRÌNH DUYỆT (không cần upload xong).
// Dùng khi backend không trả durationSec (máy local không có Cloudinary)
const getVideoDuration = (file: File) =>
  new Promise<number | undefined>((resolve) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata' // chỉ tải phần đầu file (thông tin), không tải cả video
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(Number.isFinite(video.duration) ? Math.round(video.duration) : undefined)
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(undefined)
    }
    video.src = url
  })

function LectureForm({ target, onDone }: { target: LectureTarget; onDone: () => void }) {
  const { sectionId, lecture } = target
  const createMutation = useCreateLectureMutation()
  const updateMutation = useUpdateLectureMutation()
  const uploadVideoMutation = useUploadVideoMutation()
  const isSaving = createMutation.isPending || updateMutation.isPending
  const inputRef = useRef<HTMLInputElement>(null)

  const form = useForm<LectureContentType>({
    resolver: zodResolver(LectureContentSchema),
    defaultValues: lecture
      ? {
          title: lecture.title,
          videoUrl: lecture.videoUrl ?? undefined, // API: null = chưa có video; form dùng undefined
          content: lecture.content,
          durationSec: lecture.durationSec,
          isPreview: lecture.isPreview
        }
      : { title: '', videoUrl: undefined, content: '', durationSec: 0, isPreview: false }
  })

  const onSubmit = async (data: LectureContentType) => {
    if (isSaving) return
    try {
      const result = lecture
        ? await updateMutation.mutateAsync({ id: lecture.id, body: data })
        : await createMutation.mutateAsync({ ...data, sectionId })
      toast.success(result.payload.message)
      onDone()
    } catch (error) {
      handleErrorApi({ error, setError: form.setError })
    }
  }

  // Chọn file → kiểm tra → đo thời lượng → upload → điền url + thời lượng vào form (CHƯA lưu bài, bấm Lưu mới lưu)
  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!VIDEO_TYPES.includes(file.type)) {
      toast.error('Chỉ chấp nhận video MP4, WEBM hoặc MOV')
      return
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      toast.error(`Video tối đa ${MAX_VIDEO_MB} MB`)
      return
    }

    const localDuration = await getVideoDuration(file)
    try {
      const result = await uploadVideoMutation.mutateAsync(file)
      // setValue: đổi giá trị 1 ô từ code (không phải người dùng gõ). shouldDirty: tính là "đã sửa"
      form.setValue('videoUrl', result.payload.data.url, { shouldDirty: true, shouldValidate: true })
      // Ưu tiên thời lượng Cloudinary đo (chuẩn hơn), không có thì dùng số trình duyệt đo được
      const duration = result.payload.data.durationSec ?? localDuration
      if (duration !== undefined) form.setValue('durationSec', duration, { shouldDirty: true, shouldValidate: true })
      toast.success('Đã tải video lên. Bấm Lưu để lưu bài giảng.')
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6 px-4 pb-4'>
      <FieldGroup>
        <Controller
          name='title'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='lecture-title'>Tên bài giảng</FieldLabel>
              <Input {...field} id='lecture-title' aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='videoUrl'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='lecture-video'>Video</FieldLabel>
              {field.value && (
                // key: đổi video thì tạo thẻ <video> mới, không phát tiếp video cũ
                <video key={field.value} src={field.value} controls className='aspect-video w-full rounded-lg bg-black' />
              )}
              <div className='flex gap-2'>
                {/* Dán link video có sẵn (mp4...) HOẶC tải file lên bằng nút bên cạnh */}
                <Input
                  id='lecture-video'
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value.trim() === '' ? undefined : e.target.value)}
                  placeholder='https://... hoặc tải video lên'
                  aria-invalid={fieldState.invalid}
                />
                <input
                  ref={inputRef}
                  type='file'
                  accept={VIDEO_TYPES.join(',')}
                  className='hidden'
                  onChange={handleVideoChange}
                />
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => inputRef.current?.click()}
                  disabled={uploadVideoMutation.isPending}
                >
                  {uploadVideoMutation.isPending ? <Loader2 className='animate-spin' /> : <Upload />}
                  Tải lên
                </Button>
              </div>
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : (
                <FieldDescription>
                  {uploadVideoMutation.isPending
                    ? 'Đang tải video lên, video lớn có thể mất vài phút...'
                    : `MP4, WEBM hoặc MOV, tối đa ${MAX_VIDEO_MB} MB.`}
                </FieldDescription>
              )}
            </Field>
          )}
        />

        <Controller
          name='durationSec'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='lecture-duration'>Thời lượng (giây)</FieldLabel>
              <Input
                id='lecture-duration'
                type='number'
                inputMode='numeric'
                min={0}
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : (
                <FieldDescription>
                  Tự điền khi tải video lên.
                  {field.value ? ` Hiển thị: ${formatClock(field.value)}` : ''}
                </FieldDescription>
              )}
            </Field>
          )}
        />

        <Controller
          name='content'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='lecture-content'>Nội dung / ghi chú</FieldLabel>
              <Textarea
                {...field}
                id='lecture-content'
                rows={6}
                placeholder='Tóm tắt bài, link tài liệu, bài tập...'
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='isPreview'
          control={form.control}
          render={({ field }) => (
            <Field orientation='horizontal'>
              {/* onCheckedChange trả true / false / 'indeterminate' → chỉ nhận đúng true */}
              <Checkbox
                id='lecture-preview'
                name={field.name}
                checked={field.value ?? false}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              <FieldContent>
                <FieldLabel htmlFor='lecture-preview'>Cho xem thử miễn phí</FieldLabel>
                <FieldDescription>Người chưa ghi danh vẫn xem được bài này ở trang giới thiệu khóa học.</FieldDescription>
              </FieldContent>
            </Field>
          )}
        />
      </FieldGroup>

      <div className='flex justify-end gap-2'>
        <Button type='button' variant='outline' onClick={onDone}>
          Hủy
        </Button>
        {/* Đang tải video thì chưa cho lưu (lưu lúc đó sẽ mất video mới) */}
        <Button
          type='submit'
          disabled={isSaving || uploadVideoMutation.isPending || (Boolean(lecture) && !form.formState.isDirty)}
        >
          {isSaving && <Loader2 className='animate-spin' />}
          {lecture ? 'Lưu thay đổi' : 'Thêm bài giảng'}
        </Button>
      </div>
    </form>
  )
}
