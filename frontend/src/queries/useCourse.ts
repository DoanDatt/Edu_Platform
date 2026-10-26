import courseApiRequest from '@/apiRequests/course'
import { GetMyCoursesQueryType, UpdateCourseBodyType } from '@/schemaValidations/course.schema'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useInstructorCourseQuery = (query?: Partial<GetMyCoursesQueryType>) => {
  return useQuery({
    queryKey: ['courses', 'mine', query],
    queryFn: () => courseApiRequest.mine(query),
    placeholderData: keepPreviousData // chuyển trang: giữ dữ liệu trang cũ trong lúc tải, bảng không nháy trống
  })
}

export const useInstructorCourseDetailQuery = (id: number) => {
  return useQuery({
    queryKey: ['courses', 'mine', id],
    queryFn: () => courseApiRequest.getMine(id)
  })
}

export const useCreateCourseMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: courseApiRequest.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    }
  })
}

export const useUpdateCourseMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateCourseBodyType }) => courseApiRequest.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    }
  })
}

export const useDeleteCourseMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: courseApiRequest.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    }
  })
}
