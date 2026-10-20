import courseApiRequest from '@/apiRequests/course'
import { getIdFromSlugUrl } from '@/lib/format'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

export default function CourseDetailPage({ params }: PageProps<`/courses/[slug]`>) {
  return (
    <Suspense fallback={<p className='text-muted-foreground'>Đang tải khóa học</p>}>
      <CourseDetail params={params} />
    </Suspense>
  )
}

async function CourseDetail({ params }: { params: Promise<{ slug: string }> }) {
  // params cũng là Promise phải await

  const { slug } = await params
  // 2. 'react-tu-co-ban-den-nang-cao-i.15' → 15
  const id = getIdFromSlugUrl(slug)
  // 3. Slug bậy (/courses/abc → NaN) → hiện trang 404 của Next, KHÔNG gọi API
  if (!Number.isInteger(id) || id <= 0) notFound()
  // 4. Server không có localStorage → tự đọc token trong cookie (route handler login đã lưu vào đây)
  const accessToken = (await cookies()).get('accessToken')?.value
  // Gọi API
  const course = (await courseApiRequest.getDetail(id, accessToken)).payload.data

  return (
    <div className='flex flex-col gap-4'>
      <h1 className='text-3xl font-bold'>{course.title}</h1>
      {/* Tạm in danh sách chương để kiểm tra schema sections */}
      <ul className='list-disc pl-6'>
        {course.sections.map((section) => (
          <li key={section.id}>
            {section.title} ({section.lectures.length} bài)
          </li>
        ))}
      </ul>
    </div>
  )
}
