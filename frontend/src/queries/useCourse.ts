import courseApiRequest from '@/apiRequests/course'
import { GetCoursesQueryType } from '@/schemaValidations/course.schema'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

// ===== queryKey =====
// Gom mọi queryKey của course vào 1 chỗ: không gõ sai, và mọi key đều bắt đầu bằng 'courses'
// → invalidateQueries({ queryKey: courseKeys.all }) làm mới TẤT CẢ dữ liệu course một lần
//   (useEnrollment.ts dùng sau khi ghi danh).
// Tham số (query) nằm trong key: đổi trang / bộ lọc là key khác → React Query tự gọi API mới.
// Phần giảng viên / admin (mine, pending, adminDetail...) thêm vào khi làm Mốc 4, 5
export const courseKeys = {
  all: ['courses'] as const,
  list: (query?: Partial<GetCoursesQueryType>) => ['courses', 'list', query] as const
}

// Trang /courses, /courses/[slug] lấy dữ liệu ở Server Component (gọi thẳng courseApiRequest).
// Hook này dùng khi cần danh sách ở Client Component (ví dụ ô tìm kiếm gợi ý)
export const useCourseListQuery = (query?: Partial<GetCoursesQueryType>) => {
  return useQuery({
    queryKey: courseKeys.list(query),
    queryFn: () => courseApiRequest.list(query),
    placeholderData: keepPreviousData // đổi trang: giữ trang cũ trong lúc tải, không bị nháy trống
  })
}
