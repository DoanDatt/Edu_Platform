import PageBanner from '@/components/page-banner'
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
      <PageBanner eyebrow='Góc học tập' title='Khóa học của tôi' description='Tiếp tục học từ chỗ bạn dừng lại.' />
      <MyCourses />
    </div>
  )
}
