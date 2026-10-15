import enrollmentApiRequest from '@/apiRequests/enrollment'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { courseKeys } from './useCourse'

export const useEnrollMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: enrollmentApiRequest.create,
    // Ghi danh làm đổi studentCount và isEnrolled của khóa → làm mới dữ liệu course
    onSuccess: () => queryClient.invalidateQueries({ queryKey: courseKeys.all })
  })
}
