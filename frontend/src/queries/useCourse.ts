import courseApiRequest from '@/apiRequests/course'
import {
  GetAdminCoursesQueryType,
  GetCourseStudentsQueryType,
  GetCoursesQueryType,
  GetMyCoursesQueryType,
  GetPendingCoursesQueryType,
  RejectCourseBodyType,
  UnpublishCourseBodyType,
  UpdateCourseBodyType
} from '@/schemaValidations/course.schema'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// ===== queryKey =====
// Gom mọi queryKey của course vào 1 chỗ: không gõ sai, và mọi key đều bắt đầu bằng 'courses'
// → invalidateQueries({ queryKey: courseKeys.all }) làm mới TẤT CẢ dữ liệu course một lần.
// Tham số (query, id) nằm trong key: đổi trang / bộ lọc là key khác → React Query tự gọi API mới
export const courseKeys = {
  all: ['courses'] as const,
  list: (query?: Partial<GetCoursesQueryType>) => ['courses', 'list', query] as const,
  mine: (query?: Partial<GetMyCoursesQueryType>) => ['courses', 'mine', query] as const,
  mineDetail: (id: number) => ['courses', 'mine-detail', id] as const,
  students: (id: number, query?: Partial<GetCourseStudentsQueryType>) => ['courses', 'students', id, query] as const,
  adminList: (query?: Partial<GetAdminCoursesQueryType>) => ['courses', 'admin', query] as const,
  pending: (query?: Partial<GetPendingCoursesQueryType>) => ['courses', 'pending', query] as const,
  adminDetail: (id: number) => ['courses', 'admin-detail', id] as const
}

// Sau khi thêm / sửa / xóa / đổi trạng thái 1 khóa: làm mới mọi dữ liệu course.
// Chỉ những query ĐANG hiển thị mới gọi lại API ngay, query khác chỉ bị đánh dấu "cũ"
// → đơn giản mà không tốn request thừa, khỏi phải nhớ thao tác nào ảnh hưởng danh sách nào
const useInvalidateCourses = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: courseKeys.all })
}

// ===== Công khai =====
// Trang /courses, /courses/[slug] thường lấy dữ liệu ở Server Component (gọi thẳng courseApiRequest).
// Hook này dùng khi cần danh sách ở Client Component (ví dụ ô tìm kiếm gợi ý)
export const useCourseListQuery = (query?: Partial<GetCoursesQueryType>) => {
  return useQuery({
    queryKey: courseKeys.list(query),
    queryFn: () => courseApiRequest.list(query),
    placeholderData: keepPreviousData // đổi trang: giữ trang cũ trong lúc tải, bảng không bị nháy trống
  })
}

// ===== Giảng viên =====

export const useMyCoursesQuery = (query?: Partial<GetMyCoursesQueryType>) => {
  return useQuery({
    queryKey: courseKeys.mine(query),
    queryFn: () => courseApiRequest.getMine(query),
    placeholderData: keepPreviousData
  })
}

// enabled: false khi chưa có id (ví dụ dialog sửa chưa mở) → không gọi API
export const useMyCourseDetailQuery = ({ id, enabled = true }: { id: number; enabled?: boolean }) => {
  return useQuery({
    queryKey: courseKeys.mineDetail(id),
    queryFn: () => courseApiRequest.getMineDetail(id),
    enabled
  })
}

export const useCourseStudentsQuery = (id: number, query?: Partial<GetCourseStudentsQueryType>) => {
  return useQuery({
    queryKey: courseKeys.students(id, query),
    queryFn: () => courseApiRequest.getStudents(id, query),
    placeholderData: keepPreviousData
  })
}

export const useCreateCourseMutation = () => {
  const invalidateCourses = useInvalidateCourses()
  return useMutation({
    mutationFn: courseApiRequest.create,
    onSuccess: invalidateCourses
  })
}

// mutationFn chỉ nhận 1 tham số → gộp id và body: mutate({ id: 15, title: '...', ... })
export const useUpdateCourseMutation = () => {
  const invalidateCourses = useInvalidateCourses()
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateCourseBodyType & { id: number }) => courseApiRequest.update(id, body),
    onSuccess: invalidateCourses
  })
}

export const useDeleteCourseMutation = () => {
  const invalidateCourses = useInvalidateCourses()
  return useMutation({
    mutationFn: courseApiRequest.delete,
    onSuccess: invalidateCourses
  })
}

export const useSubmitCourseMutation = () => {
  const invalidateCourses = useInvalidateCourses()
  return useMutation({
    mutationFn: courseApiRequest.submit,
    onSuccess: invalidateCourses
  })
}

// ===== Admin =====

export const useAdminCoursesQuery = (query?: Partial<GetAdminCoursesQueryType>) => {
  return useQuery({
    queryKey: courseKeys.adminList(query),
    queryFn: () => courseApiRequest.getAdminList(query),
    placeholderData: keepPreviousData
  })
}

export const usePendingCoursesQuery = (query?: Partial<GetPendingCoursesQueryType>) => {
  return useQuery({
    queryKey: courseKeys.pending(query),
    queryFn: () => courseApiRequest.getPending(query),
    placeholderData: keepPreviousData
  })
}

export const useAdminCourseDetailQuery = ({ id, enabled = true }: { id: number; enabled?: boolean }) => {
  return useQuery({
    queryKey: courseKeys.adminDetail(id),
    queryFn: () => courseApiRequest.getAdminDetail(id),
    enabled
  })
}

export const useApproveCourseMutation = () => {
  const invalidateCourses = useInvalidateCourses()
  return useMutation({
    mutationFn: courseApiRequest.approve,
    onSuccess: invalidateCourses
  })
}

export const useRejectCourseMutation = () => {
  const invalidateCourses = useInvalidateCourses()
  return useMutation({
    mutationFn: ({ id, ...body }: RejectCourseBodyType & { id: number }) => courseApiRequest.reject(id, body),
    onSuccess: invalidateCourses
  })
}

export const useUnpublishCourseMutation = () => {
  const invalidateCourses = useInvalidateCourses()
  return useMutation({
    mutationFn: ({ id, ...body }: UnpublishCourseBodyType & { id: number }) => courseApiRequest.unpublish(id, body),
    onSuccess: invalidateCourses
  })
}
