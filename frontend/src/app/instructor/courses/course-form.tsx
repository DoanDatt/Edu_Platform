'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { CourseLevel, CourseLevelLabels } from '@/constants/type'
import { formatPrice } from '@/lib/format'
import { handleErrorApi } from '@/lib/utils'
import { useCreateCourseMutation, useUpdateCourseMutation } from '@/queries/useCourse'
import { useUploadImageMutation } from '@/queries/useUpload'
import { CategoryType } from '@/schemaValidations/category.schema'
import { CreateCourseBodySchema, CreateCourseBodyType, InstructorCourseType } from '@/schemaValidations/course.schema'
import { IMAGE_TYPES, MAX_IMAGE_MB } from '@/schemaValidations/upload.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImageUp, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

const LANGUAGES = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'Tiếng Anh' }
]

// Khóa học từ API → giá trị form. thumbnail: API trả null (chưa có ảnh), schema form dùng undefined
const toFormValues = (course: InstructorCourseType): CreateCourseBodyType => ({
  title: course.title,
  subtitle: course.subtitle,
  description: course.description,
  thumbnail: course.thumbnail ?? undefined,
  price: course.price,
  level: course.level,
  language: course.language,
  categoryId: course.category.id
})

// Một form cho 2 trang:
//   /instructor/courses/new        → không truyền course → TẠO MỚI
//   /instructor/courses/[id]/edit  → truyền course       → SỬA (điền sẵn dữ liệu cũ)
// categories lấy ở Server Component rồi truyền xuống (dữ liệu thường thì truyền qua props được)
export default function CourseForm({ categories, course }: { categories: CategoryType[]; course?: InstructorCourseType }) {
  const router = useRouter()
  const createMutation = useCreateCourseMutation()
  const updateMutation = useUpdateCourseMutation()
  const uploadMutation = useUploadImageMutation()
  const isSaving = createMutation.isPending || updateMutation.isPending

  const form = useForm<CreateCourseBodyType>({
    resolver: zodResolver(CreateCourseBodySchema),
    // Tạo mới: price, categoryId để trống (undefined) → bắt người dùng tự nhập / chọn.
    // level, language lấy đúng giá trị mặc định của DB
    defaultValues: course
      ? toFormValues(course)
      : {
          title: '',
          subtitle: '',
          description: '',
          thumbnail: undefined,
          price: undefined,
          level: CourseLevel.ALL_LEVELS,
          language: 'vi',
          categoryId: undefined
        }
  })

  // Ảnh bìa: upload ngay khi chọn file, form chỉ giữ url trả về (giống avatar)
  const uploadThumbnail = async (file: File) => {
    const result = await uploadMutation.mutateAsync(file)
    return result.payload.data.url
  }

  const onSubmit = async (data: CreateCourseBodyType) => {
    if (isSaving) return
    try {
      if (course) {
        const result = await updateMutation.mutateAsync({ id: course.id, body: data })
        toast.success(result.payload.message)
        // Dữ liệu vừa lưu thành giá trị "gốc" mới → isDirty = false → nút Lưu mờ lại
        form.reset(toFormValues(result.payload.data))
      } else {
        const result = await createMutation.mutateAsync(data)
        toast.success(result.payload.message)
        // Vòng D: chuyển sang trang soạn chương / bài của khóa vừa tạo
        router.push('/instructor/courses')
      }
    } catch (error) {
      // 422 (ví dụ danh mục vừa bị xóa) → lỗi hiện dưới đúng ô; lỗi khác → toast
      handleErrorApi({ error, setError: form.setError })
    }
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-6'>
      {/* Máy tính: 2 cột (nội dung chính bên trái, ảnh + thông số bên phải). Điện thoại: 1 cột */}
      <div className='grid gap-6 lg:grid-cols-[1fr_340px]'>
        <Card>
          <CardContent>
            <FieldGroup>
              <Controller
                name='title'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='course-title'>Tên khóa học</FieldLabel>
                    <Input
                      {...field}
                      id='course-title'
                      placeholder='Ví dụ: ReactJS từ cơ bản đến nâng cao'
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name='subtitle'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='course-subtitle'>Mô tả ngắn</FieldLabel>
                    <Input
                      {...field}
                      id='course-subtitle'
                      placeholder='Một câu giới thiệu, hiện dưới tên khóa học'
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name='description'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='course-description'>Giới thiệu chi tiết</FieldLabel>
                    <Textarea
                      {...field}
                      id='course-description'
                      rows={10}
                      placeholder='Khóa học dạy gì, dành cho ai, học xong làm được gì...'
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <FieldGroup>
              <Controller
                name='thumbnail'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Ảnh bìa</FieldLabel>
                    <ThumbnailInput
                      value={field.value}
                      onChange={field.onChange}
                      onUpload={uploadThumbnail}
                      uploading={uploadMutation.isPending}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name='categoryId'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='course-category'>Danh mục</FieldLabel>
                    {/* Select chỉ làm việc với CHUỖI: hiện thì String(id), chọn xong đổi lại Number() cho đúng schema.
                        value '' (chưa chọn) → Select hiện placeholder */}
                    <Select
                      name={field.name}
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <SelectTrigger id='course-category' className='w-full' aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder='Chọn danh mục' />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={String(category.id)}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <div className='grid grid-cols-2 gap-4'>
                <Controller
                  name='level'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor='course-level'>Trình độ</FieldLabel>
                      <Select name={field.name} value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id='course-level' className='w-full' aria-invalid={fieldState.invalid}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(CourseLevel).map((level) => (
                            <SelectItem key={level} value={level}>
                              {CourseLevelLabels[level]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name='language'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor='course-language'>Ngôn ngữ</FieldLabel>
                      <Select name={field.name} value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id='course-language' className='w-full' aria-invalid={fieldState.invalid}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((language) => (
                            <SelectItem key={language.value} value={language.value}>
                              {language.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>

              <Controller
                name='price'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='course-price'>Giá (VNĐ)</FieldLabel>
                    {/* Ô number vẫn trả về CHUỖI → valueAsNumber đổi sang số. Xóa trắng ô → undefined
                        (không dùng 0, để người dùng thấy lỗi "Vui lòng nhập giá" thay vì vô tình để miễn phí) */}
                    <Input
                      id='course-price'
                      type='number'
                      inputMode='numeric'
                      min={0}
                      step={1000}
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
                        {field.value !== undefined ? `Hiển thị: ${formatPrice(field.value)}` : 'Nhập 0 nếu miễn phí'}
                      </FieldDescription>
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
        </Card>
      </div>

      <div className='flex justify-end gap-2'>
        <Button asChild type='button' variant='outline'>
          <Link href='/instructor/courses'>Hủy</Link>
        </Button>
        {/* Đang upload ảnh thì chưa cho lưu (lưu lúc đó sẽ mất ảnh mới).
            Sửa: chưa thay đổi gì (isDirty = false) thì không cho bấm */}
        <Button
          type='submit'
          disabled={isSaving || uploadMutation.isPending || (Boolean(course) && !form.formState.isDirty)}
        >
          {isSaving && <Loader2 className='animate-spin' />}
          {course ? 'Lưu thay đổi' : 'Tạo khóa học'}
        </Button>
      </div>
    </form>
  )
}

// Ô chọn ảnh bìa. Chỉ lo giao diện + kiểm tra file; upload thật do form cha truyền vào (onUpload)
// → ô này không biết gì về API, form cha quyết định upload ở đâu
function ThumbnailInput({
  value,
  onChange,
  onUpload,
  uploading
}: {
  value?: string
  onChange: (url: string) => void
  onUpload: (file: File) => Promise<string>
  uploading: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error('Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc GIF')
      return
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(`Ảnh tối đa ${MAX_IMAGE_MB} MB`)
      return
    }

    setPreviewUrl(URL.createObjectURL(file))
    try {
      // Chỉ đổi giá trị form → ảnh CHƯA được lưu vào khóa học cho tới khi bấm Lưu / Tạo
      onChange(await onUpload(file))
    } catch (error) {
      handleErrorApi({ error })
    } finally {
      setPreviewUrl(null)
    }
  }

  const imageSrc = previewUrl ?? value

  return (
    <div className='flex flex-col gap-3'>
      <div className='relative aspect-video overflow-hidden rounded-lg border bg-muted'>
        {imageSrc ? (
          // blob: (ảnh xem trước) không qua được bộ tối ưu ảnh của Next → unoptimized
          <Image
            src={imageSrc}
            alt='Ảnh bìa khóa học'
            fill
            sizes='340px'
            unoptimized={imageSrc.startsWith('blob:')}
            className='object-cover'
          />
        ) : (
          <div className='flex size-full flex-col items-center justify-center gap-1 text-sm text-muted-foreground'>
            <ImageUp className='size-6' />
            Chưa có ảnh bìa
          </div>
        )}
        {uploading && (
          <div className='absolute inset-0 flex items-center justify-center bg-black/40'>
            <Loader2 className='size-6 animate-spin text-white' />
          </div>
        )}
      </div>
      <input ref={inputRef} type='file' accept={IMAGE_TYPES.join(',')} className='hidden' onChange={handleFileChange} />
      <Button type='button' variant='outline' onClick={() => inputRef.current?.click()} disabled={uploading}>
        <ImageUp />
        {value ? 'Đổi ảnh' : 'Chọn ảnh'}
      </Button>
      <p className='text-xs text-muted-foreground'>
        Tỉ lệ 16:9, JPG / PNG / WEBP / GIF, tối đa {MAX_IMAGE_MB} MB.
      </p>
    </div>
  )
}

export function CourseFormSkeleton() {
  return (
    <div className='grid gap-6 lg:grid-cols-[1fr_340px]'>
      <Skeleton className='h-96 rounded-xl' />
      <Skeleton className='h-96 rounded-xl' />
    </div>
  )
}
