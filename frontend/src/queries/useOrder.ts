import orderApiRequest from '@/apiRequests/order'
import { GetMyOrdersQueryType, StartPaymentBodyType } from '@/schemaValidations/order.schema'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useMyOrderQuery = (query?: Partial<GetMyOrdersQueryType>) => {
  return useQuery({
    queryKey: ['orders', 'mine', query],
    queryFn: () => orderApiRequest.mine(query),
    placeholderData: keepPreviousData
  })
}

export const useOrderQuery = (id: number, poll = false) => {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => orderApiRequest.getDetail(id),
    // nếu poll là true thì 5s hỏi 1 lần, ngược lại thì không hỏi
    refetchInterval: poll ? 5000 : false
  })
}

export const usePaymentMethodsQuery = () => {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: orderApiRequest.paymentMethods
  })
}

export const useCreateOrderMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: orderApiRequest.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] })
  })
}

export const useCancelOrderMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: orderApiRequest.cancel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] })
  })
}

export const useStartPaymentMutation = () => {
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: StartPaymentBodyType }) => orderApiRequest.pay(id, body)
  })
}

export const useConfirmPaymentMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: orderApiRequest.confirm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      queryClient.invalidateQueries({ queryKey: ['courses'] })
    }
  })
}
