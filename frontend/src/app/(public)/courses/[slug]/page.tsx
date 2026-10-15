import courseApiRequest from '@/apiRequests/course'
import { getIdFromSlugUrl } from '@/lib/format'
import type { Metadata } from 'next'
import { cache, Suspense } from 'react'
import CourseDetail, { CourseDetailSkeleton } from './course-detail'

type Props = { params: Promise<{ slug: string }> }

// cache() của React: trong CÙNG 1 lần render, gọi nhiều lần với cùng id thì chỉ gọi API 1 lần
const getCourseForMetadata = cache(async (id: number) => {
  try {
    return (await courseApiRequest.getDetail(id)).payload.data
  } catch {
    return null
  }
})

// Tiêu đề tab, mô tả, ảnh khi chia sẻ link lên Facebook / Zalo (Open Graph)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = getIdFromSlugUrl((await params).slug)
  const course = Number.isInteger(id) ? await getCourseForMetadata(id) : null
  if (!course) return { title: 'Không tìm thấy khóa học' }

  const description = course.subtitle || `Khóa học ${course.title} của ${course.instructor.name} trên EduPlatform`
  return {
    title: course.title,
    description,
    openGraph: {
      title: course.title,
      description,
      images: course.thumbnail ? [course.thumbnail] : undefined
    }
  }
}

// Phần đọc params / cookies / gọi API nằm trong <Suspense> (bắt buộc với cacheComponents)
export default function CourseDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<CourseDetailSkeleton />}>
      <CourseDetail params={params} />
    </Suspense>
  )
}
