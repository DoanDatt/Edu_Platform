import roleApiRequest from '@/apiRequests/role'
import { useQuery } from '@tanstack/react-query'

export const useRolesQuery = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => roleApiRequest.list({ limit: 100 })
  })
}
