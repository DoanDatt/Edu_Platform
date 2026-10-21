import enrollmentApiRequest from '@/apiRequests/enrollment'
import { PaginationQueryType } from '@/schemaValidations/common.schema'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// useMutation: dùng cho thao tác LÀM THAY ĐỔI dữ liệu (thêm / sửa / xóa), chạy khi người dùng bấm.
// Khác useQuery (đọc dữ liệu, tự chạy khi component hiện ra).
// Trả về: mutateAsync (gọi API), isPending (đang gọi → làm mờ nút, hiện vòng xoay), error...
//
// Sau khi ghi danh, trang chi tiết lấy dữ liệu ở SERVER nên làm mới bằng router.refresh() trong nút.
// Khi có dữ liệu course lấy ở client (trang /my-courses, Mốc 3) thì thêm onSuccess: invalidateQueries
export const useEnrollMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: enrollmentApiRequest.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enrollments'] })
  })
}

export const useMyEnrollmentQuery = (query?: Partial<PaginationQueryType>) => {
  return useQuery({
    queryKey: ['enrollments', 'mine', query],
    queryFn: () => enrollmentApiRequest.mine(query)
  })
}

export const useMyLearningQuery = (courseId: number) => {
  return useQuery({
    queryKey: ['enrollments', 'mine', courseId],
    queryFn: () => enrollmentApiRequest.getMine(courseId)
  })
}
