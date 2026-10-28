import { statsApiRequest } from '@/apiRequests/stats'
import { useQuery } from '@tanstack/react-query'

export const useInstructorStatsQuery = () => {
  return useQuery({
    queryKey: ['stats', 'instructor'],
    queryFn: statsApiRequest.instructor
  })
}

export const useAdminStatsQuery = () => {
  return useQuery({
    queryKey: ['stats', 'admin'],
    queryFn: statsApiRequest.admin
  })
}
