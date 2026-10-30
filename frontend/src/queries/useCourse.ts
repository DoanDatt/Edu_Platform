import courseApiRequest from '@/apiRequests/course'
import { HttpError } from '@/lib/http'
import {
  GetAdminCoursesQueryType,
  GetCourseStudentsQueryType,
  GetMyCoursesQueryType,
  RejectCourseBodyType,
  UpdateCourseBodyType
} from '@/schemaValidations/course.schema'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Mặc định React Query thử lại 3 lần khi lỗi (mất vài giây). 404 / 403 thử lại bao nhiêu lần vẫn vậy
// → báo lỗi ngay. Lỗi khác (mạng chập chờn, server khởi động chậm) vẫn thử lại tối đa 3 lần.
// Dùng chung cho các query lấy 1 khóa theo id (giảng viên, admin)
const retryUnlessNotFound = (failureCount: number, error: Error) =>
  !(error instanceof HttpError && [403, 404].includes(error.status)) && failureCount < 3

// Mọi thay đổi khóa học (tạo, sửa, xóa, gửi duyệt, duyệt, từ chối, gỡ) → tải lại mọi danh sách,
// chi tiết khóa và số liệu dashboard (tổng khóa, số chờ duyệt...)
const useInvalidateCoursesAndStats = () => {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['courses'] })
    queryClient.invalidateQueries({ queryKey: ['stats'] })
  }
}

// lấy toàn bộ danh sách khóa học của giảng viên
export const useInstructorCourseQuery = (query?: Partial<GetMyCoursesQueryType>) => {
  return useQuery({
    queryKey: ['courses', 'mine', query],
    queryFn: () => courseApiRequest.mine(query),
    placeholderData: keepPreviousData // chuyển trang: giữ dữ liệu trang cũ trong lúc tải, bảng không nháy trống
  })
}
// lấy 1 khóa học của giảng viên
export const useInstructorCourseDetailQuery = (id: number) => {
  return useQuery({
    queryKey: ['courses', 'mine', id],
    queryFn: () => courseApiRequest.getMine(id),
    retry: retryUnlessNotFound
  })
}
// tạo khóa học dành cho giảng viên
export const useCreateCourseMutation = () => {
  const invalidate = useInvalidateCoursesAndStats()
  return useMutation({
    mutationFn: courseApiRequest.create,
    onSuccess: invalidate
  })
}

export const useUpdateCourseMutation = () => {
  const invalidate = useInvalidateCoursesAndStats()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateCourseBodyType }) => courseApiRequest.update(id, body),
    onSuccess: invalidate
  })
}

export const useDeleteCourseMutation = () => {
  const invalidate = useInvalidateCoursesAndStats()
  return useMutation({
    mutationFn: courseApiRequest.delete,
    onSuccess: invalidate
  })
}

// Gửi duyệt: trạng thái khóa đổi → bảng, trang soạn nội dung, số "Chờ duyệt" trên dashboard đều phải tải lại
export const useSubmitCourseMutation = () => {
  const invalidate = useInvalidateCoursesAndStats()
  return useMutation({
    mutationFn: courseApiRequest.submit,
    onSuccess: invalidate
  })
}

// Học viên của 1 khóa. Key nằm DƯỚI ['courses', 'mine', id] → sửa / gửi duyệt khóa (invalidate ['courses'])
// cũng làm mới luôn danh sách này. keepPreviousData: chuyển trang không nháy trống (giống bảng khóa học)
export const useCourseStudentsQuery = (id: number, query?: Partial<GetCourseStudentsQueryType>) => {
  return useQuery({
    queryKey: ['courses', 'mine', id, 'students', query],
    queryFn: () => courseApiRequest.students(id, query),
    placeholderData: keepPreviousData
  })
}

// ===== Admin =====

// Key ['courses', 'admin', ...]: khác nhánh 'mine' của giảng viên, nhưng vẫn nằm dưới 'courses'
// → invalidate ['courses'] làm mới được cả hai
export const useAdminCoursesQuery = (query?: Partial<GetAdminCoursesQueryType>) => {
  return useQuery({
    queryKey: ['courses', 'admin', query],
    queryFn: () => courseApiRequest.adminList(query),
    placeholderData: keepPreviousData
  })
}

export const useAdminCourseDetailQuery = (id: number) => {
  return useQuery({
    queryKey: ['courses', 'admin', id],
    queryFn: () => courseApiRequest.adminGetDetail(id),
    retry: retryUnlessNotFound
  })
}

export const useApproveCourseMutation = () => {
  const invalidate = useInvalidateCoursesAndStats()
  return useMutation({
    mutationFn: courseApiRequest.approve,
    onSuccess: invalidate
  })
}

export const useRejectCourseMutation = () => {
  const invalidate = useInvalidateCoursesAndStats()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: RejectCourseBodyType }) => courseApiRequest.reject(id, body),
    onSuccess: invalidate
  })
}

export const useUnpublishCourseMutation = () => {
  const invalidate = useInvalidateCoursesAndStats()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: RejectCourseBodyType }) => courseApiRequest.unpublish(id, body),
    onSuccess: invalidate
  })
}
