import courseApiRequest from '@/apiRequests/course'
import reviewApiRequest from '@/apiRequests/review'
import { getIdFromSlugUrl } from '@/lib/format'
import { HttpError } from '@/lib/http'
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

  // 5. Gọi 2 API CÙNG LÚC (không cái nào phải chờ cái nào) → nhanh gần gấp đôi gọi lần lượt.
  //    allSettled (không phải all): chờ CẢ HAI xong, cho biết từng cái thành công hay thất bại
  //    → đánh giá lỗi thì trang vẫn hiện, chỉ thiếu phần đánh giá
  const [courseResult, reviewResult] = await Promise.allSettled([
    courseApiRequest.getDetail(id, accessToken),
    reviewApiRequest.list({ courseId: id, limit: 5 })
  ])

  // 6. API khóa học lỗi
  if (courseResult.status === 'rejected') {
    // 404: khóa không tồn tại / chưa xuất bản → trang 404
    // instanceof: kiểm tra đúng là HttpError (có .status) chứ không phải lỗi khác như mất mạng
    if (courseResult.reason instanceof HttpError && courseResult.reason.status === 404) notFound()
    // Lỗi khác (backend sập, 500...) → báo lỗi, header / footer vẫn còn
    return (
      <p className='rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive'>
        Không tải được khóa học. Vui lòng thử lại sau.
      </p>
    )
  }

  // Tới đây chắc chắn courseResult.status === 'fulfilled' → TypeScript cho đọc .value
  const course = courseResult.value.payload.data
  // Đánh giá lỗi → mảng rỗng, trang vẫn hiện
  const reviews = reviewResult.status === 'fulfilled' ? reviewResult.value.payload.data : []

  return (
    <div className='flex flex-col gap-4'>
      <h1 className='text-3xl font-bold'>{course.title}</h1>
      {/* Tạm in để kiểm tra API đánh giá */}
      <p className='text-muted-foreground'>{reviews.length} đánh giá</p>
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
