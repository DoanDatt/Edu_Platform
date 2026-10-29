import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import LearnCourse, { LearnCourseSkeleton } from './learn-course'

export const metadata: Metadata = {
  title: 'Học bài'
}

// /learn/15?lecture=21
// Nằm NGOÀI nhóm (public) → không có header / footer công khai, trang học toàn màn hình để tập trung.
// Chưa đăng nhập → proxy.ts chuyển về /login (đã có '/learn' trong privatePaths)
export default function LearnPage({ params }: PageProps<'/[locale]/learn/[courseId]'>) {
  return (
    // Suspense: đọc params (ở dưới) và useSearchParams (trong LearnCourse) là dữ liệu lúc chạy
    <Suspense fallback={<LearnCourseSkeleton />}>
      <LearnLoader params={params} />
    </Suspense>
  )
}

// Server: chỉ đọc + kiểm tra courseId trên URL, dữ liệu học lấy ở client (riêng từng người, có token)
async function LearnLoader({ params }: { params: Promise<{ courseId: string }> }) {
  const courseId = Number((await params).courseId)
  if (!Number.isInteger(courseId) || courseId <= 0) notFound()
  return <LearnCourse courseId={courseId} />
}
