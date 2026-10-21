'use client'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { HttpError } from '@/lib/http'
import { handleErrorApi } from '@/lib/utils'
import { useMyLearningQuery } from '@/queries/useEnrollments'
import { useLectureQuery, useToggleLectureCompleteMutation } from '@/queries/useLecture'
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Circle, Loader2, VideoOff } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import LearnCurriculum from './learn-curriculum'

// Trang học 1 khóa. Bài đang học nằm trên URL (?lecture=21): F5 không mất chỗ đang học, gửi link được
export default function LearnCourse({ courseId }: { courseId: number }) {
  const searchParams = useSearchParams()

  // ===== Hook phải gọi ở ĐẦU component, TRƯỚC mọi return sớm (luật của React: không gọi hook trong if) =====
  const learningQuery = useMyLearningQuery(courseId)
  const toggleMutation = useToggleLectureCompleteMutation()

  const learning = learningQuery.data?.payload.data
  // flatMap: gộp bài của MỌI chương thành 1 mảng phẳng theo đúng thứ tự → dễ tìm bài trước / sau
  const lectures = learning?.course.sections.flatMap((section) => section.lectures) ?? []

  // Bài đang học: theo ?lecture= trên URL; không có (hoặc id bậy) → bài đầu tiên CHƯA học → không có thì bài đầu
  const lectureParam = Number(searchParams.get('lecture'))
  const current =
    lectures.find((lecture) => lecture.id === lectureParam) ??
    lectures.find((lecture) => !lecture.completed) ??
    lectures[0]

  // Query phụ thuộc: chỉ gọi khi đã biết bài đang học (enabled trong hook)
  const lectureQuery = useLectureQuery(current?.id)

  // ===== Các trạng thái của mục lục =====
  if (learningQuery.isLoading) return <LearnCourseSkeleton />

  if (learningQuery.isError || !learning) {
    // 403: chưa ghi danh khóa này (gõ tay URL, hoặc link người khác gửi)
    const notEnrolled = learningQuery.error instanceof HttpError && learningQuery.error.status === 403
    return (
      <div className='flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center'>
        <p className='text-lg font-semibold'>
          {notEnrolled ? 'Bạn chưa ghi danh khóa học này' : 'Không tải được khóa học'}
        </p>
        <p className='max-w-sm text-sm text-muted-foreground'>
          {notEnrolled ? 'Hãy ghi danh trước khi vào học.' : 'Vui lòng thử lại sau.'}
        </p>
        <Button asChild variant='outline'>
          <Link href={notEnrolled ? '/courses' : '/my-courses'}>
            {notEnrolled ? 'Xem các khóa học' : 'Về khóa học của tôi'}
          </Link>
        </Button>
      </div>
    )
  }

  const { course, progress } = learning
  const currentIndex = current ? lectures.findIndex((lecture) => lecture.id === current.id) : -1
  const prevLecture = currentIndex > 0 ? lectures[currentIndex - 1] : undefined
  const nextLecture = currentIndex >= 0 ? lectures[currentIndex + 1] : undefined
  const hrefFor = (lectureId: number) => `/learn/${courseId}?lecture=${lectureId}`

  const toggleComplete = async () => {
    if (!current || toggleMutation.isPending) return
    try {
      // Đảo trạng thái: chưa học → đánh dấu, đã học → bỏ đánh dấu.
      // Xong thì hook tự invalidateQueries → mục lục, thanh % tải lại
      await toggleMutation.mutateAsync({ lectureId: current.id, completed: !current.completed })
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  return (
    <div className='flex min-h-screen flex-col'>
      {/* ===== Thanh trên ===== */}
      <header className='sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur'>
        <Button asChild variant='ghost' size='sm'>
          <Link href='/my-courses'>
            <ArrowLeft />
            <span className='hidden sm:inline'>Khóa học của tôi</span>
          </Link>
        </Button>
        <h1 className='flex-1 truncate font-semibold'>{course.title}</h1>
        {/* Tiến độ cả khóa: đổi ngay sau khi đánh dấu đã học (nhờ invalidateQueries) */}
        <div className='hidden items-center gap-2 text-sm sm:flex'>
          <div className='h-2 w-32 overflow-hidden rounded-full bg-muted'>
            <div className='h-full rounded-full bg-primary transition-all' style={{ width: `${progress.percent}%` }} />
          </div>
          <span className='tabular-nums text-muted-foreground'>{progress.percent}%</span>
        </div>
      </header>

      {lectures.length === 0 || !current ? (
        <p className='p-6 text-muted-foreground'>Khóa học chưa có bài giảng.</p>
      ) : (
        // Máy tính: nội dung bên trái, mục lục cố định bên phải. Điện thoại: mục lục xuống dưới
        <div className='grid flex-1 lg:grid-cols-[1fr_360px]'>
          <main className='flex flex-col'>
            {/* ===== Video ===== */}
            <div className='aspect-video w-full bg-black'>
              {lectureQuery.isLoading ? (
                <div className='flex size-full items-center justify-center'>
                  <Loader2 className='size-8 animate-spin text-white/60' />
                </div>
              ) : lectureQuery.data?.payload.data.videoUrl ? (
                // key = id bài: đổi bài thì React tạo thẻ <video> MỚI, không phát tiếp video cũ
                <video
                  key={current.id}
                  src={lectureQuery.data.payload.data.videoUrl}
                  controls
                  className='size-full'
                />
              ) : (
                <div className='flex size-full flex-col items-center justify-center gap-2 text-white/60'>
                  <VideoOff className='size-8' />
                  <span className='text-sm'>
                    {lectureQuery.isError ? 'Không tải được bài giảng' : 'Bài này không có video'}
                  </span>
                </div>
              )}
            </div>

            {/* ===== Tên bài + nút ===== */}
            <div className='flex flex-col gap-4 border-b p-4 md:p-6'>
              <h2 className='text-xl font-semibold'>{current.title}</h2>
              <div className='flex flex-wrap items-center gap-2'>
                <Button
                  onClick={toggleComplete}
                  disabled={toggleMutation.isPending}
                  variant={current.completed ? 'outline' : 'default'}
                >
                  {toggleMutation.isPending ? (
                    <Loader2 className='animate-spin' />
                  ) : current.completed ? (
                    <CheckCircle2 className='text-green-600' />
                  ) : (
                    <Circle />
                  )}
                  {current.completed ? 'Đã học' : 'Đánh dấu đã học'}
                </Button>

                <div className='ml-auto flex gap-2'>
                  <Button asChild variant='outline' size='sm' className={prevLecture ? '' : 'pointer-events-none opacity-50'}>
                    <Link href={prevLecture ? hrefFor(prevLecture.id) : '#'} aria-disabled={!prevLecture}>
                      <ChevronLeft />
                      Bài trước
                    </Link>
                  </Button>
                  <Button asChild variant='outline' size='sm' className={nextLecture ? '' : 'pointer-events-none opacity-50'}>
                    <Link href={nextLecture ? hrefFor(nextLecture.id) : '#'} aria-disabled={!nextLecture}>
                      Bài tiếp theo
                      <ChevronRight />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* ===== Ghi chú của bài ===== */}
            {lectureQuery.data?.payload.data.content && (
              <section className='flex flex-col gap-2 p-4 md:p-6'>
                <h3 className='font-semibold'>Ghi chú</h3>
                <p className='whitespace-pre-line leading-relaxed text-muted-foreground'>
                  {lectureQuery.data.payload.data.content}
                </p>
              </section>
            )}
          </main>

          {/* ===== Mục lục ===== */}
          <aside className='border-t lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:overflow-y-auto lg:border-t-0 lg:border-l'>
            <LearnCurriculum
              sections={course.sections}
              currentLectureId={current.id}
              hrefFor={hrefFor}
              completedLectures={progress.completedLectures}
              totalLectures={progress.totalLectures}
            />
          </aside>
        </div>
      )}
    </div>
  )
}

export function LearnCourseSkeleton() {
  return (
    <div className='flex min-h-screen flex-col'>
      <div className='flex h-14 items-center gap-4 border-b px-4'>
        <Skeleton className='h-8 w-32' />
        <Skeleton className='h-5 w-64' />
      </div>
      <div className='grid flex-1 lg:grid-cols-[1fr_360px]'>
        <div className='flex flex-col gap-4'>
          <Skeleton className='aspect-video w-full rounded-none' />
          <div className='flex flex-col gap-3 p-6'>
            <Skeleton className='h-6 w-1/2' />
            <Skeleton className='h-9 w-40' />
          </div>
        </div>
        <div className='flex flex-col gap-3 border-l p-4'>
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className='h-8 w-full' />
          ))}
        </div>
      </div>
    </div>
  )
}
