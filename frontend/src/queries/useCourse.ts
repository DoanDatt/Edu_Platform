import courseApiRequest from '@/apiRequests/course'
import { GetMyCoursesQueryType } from '@/schemaValidations/course.schema'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

export const useInstructorCourseQuery = (query?: Partial<GetMyCoursesQueryType>) => {
  return useQuery({
    queryKey: ['courses', 'mine', query],
    queryFn: () => courseApiRequest.mine(query),
    placeholderData: keepPreviousData // chuyển trang: giữ dữ liệu trang cũ trong lúc tải, bảng không nháy trống
  })
}
