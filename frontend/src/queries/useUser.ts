import { userApiRequest } from '@/apiRequests/user'
import { GetUsersQueryType, UpdateUserRoleBodyType, UpdateUserStatusBodyType } from '@/schemaValidations/user.schema'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useUsersQuery = (query?: Partial<GetUsersQueryType>) => {
  return useQuery({
    queryKey: ['users', query],
    queryFn: () => userApiRequest.list(query),
    placeholderData: keepPreviousData
  })
}

export const useUpdateUserStatusMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateUserStatusBodyType }) => userApiRequest.updateStatus(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    }
  })
}

export const useUpdateUserRoleMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateUserRoleBodyType }) => userApiRequest.updateRole(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    }
  })
}
