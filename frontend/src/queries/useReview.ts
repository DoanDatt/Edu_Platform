import reviewApiRequest from '@/apiRequests/review'
import { UpdateReviewBodyType } from '@/schemaValidations/review.schema'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useMyReviewQuery = (courseId: number) => {
  return useQuery({
    queryKey: ['reviews', courseId],
    queryFn: () => reviewApiRequest.getMine(courseId)
  })
}

export const useCreateReviewMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reviewApiRequest.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviews'] })
  })
}

export const useUpdateReviewMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, body }: { reviewId: number; body: UpdateReviewBodyType }) =>
      reviewApiRequest.update(reviewId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviews'] })
  })
}

export const useDeleteReviewMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reviewApiRequest.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviews'] })
  })
}
