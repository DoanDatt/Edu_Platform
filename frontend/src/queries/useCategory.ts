import categoryApiRequest from '@/apiRequests/category'
import { UpdateCategoryBodyType } from '@/schemaValidations/category.schema'
import { PaginationQueryType } from '@/schemaValidations/common.schema'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useCategoriesQuery = (query?: Partial<PaginationQueryType>) => {
  return useQuery({
    queryKey: ['categories', query],
    queryFn: () => categoryApiRequest.list(query),
    placeholderData: keepPreviousData
  })
}
export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: categoryApiRequest.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  })
}

export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateCategoryBodyType }) => categoryApiRequest.update(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  })
}

export const useDeleteCategoryMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: categoryApiRequest.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  })
}
