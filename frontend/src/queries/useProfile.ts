import profileApiRequest from '@/apiRequests/profile'
import { UpdateProfileBodyType } from '@/schemaValidations/profile.schema'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useProfileQuery = () => {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: profileApiRequest.get
  })
}

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateProfileBodyType) => profileApiRequest.update(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['me'] })
    }
  })
}

export const useChangePasswordMutation = () => {
  return useMutation({
    mutationFn: profileApiRequest.changePassword
  })
}
