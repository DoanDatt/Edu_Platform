import type { Metadata } from 'next'
import MyCourses from './my-courses'

export const metadata: Metadata = {
  title: 'Khóa học của tôi'
}

// Server Component: chỉ lo metadata + tiêu đề.
// Phần danh sách là Client Component (MyCourses) vì dùng hook useQuery:
//   - dữ liệu RIÊNG của người đăng nhập, không cần SEO
//   - token nằm ở localStorage (client), http.ts tự gắn
//   - ghi danh / học bài xong chỉ cần invalidateQueries là danh sách tự cập nhật
// Chưa đăng nhập vào trang này → proxy.ts tự chuyển về /login
export default function MyCoursesPage() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-1'>
        <h1 className='text-3xl font-bold tracking-tight'>Khóa học của tôi</h1>
        <p className='text-muted-foreground'>Tiếp tục học từ chỗ bạn dừng lại.</p>
      </div>
      <MyCourses />
    </div>
  )
}
