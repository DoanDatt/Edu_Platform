import http from '@/lib/http'
import { toQueryString } from '@/lib/utils'
import {
  CreateOrderBodyType,
  GetMyOrdersQueryType,
  OrderListResType,
  OrderResType,
  PaymentMethodResType,
  StartPaymentBodyType,
  StartPaymentResType
} from '@/schemaValidations/order.schema'

const prefix = '/orders'

export const orderApiRequest = {
  create: (body: CreateOrderBodyType) => http.post<OrderResType>(`${prefix}`, body),
  mine: (query?: Partial<GetMyOrdersQueryType>) => http.get<OrderListResType>(`${prefix}/mine${toQueryString(query)}`),
  getDetail: (id: number) => http.get<OrderResType>(`${prefix}/${id}`),
  cancel: (id: number) => http.post<OrderResType>(`${prefix}/${id}/cancel`, null),
  pay: (id: number, body: StartPaymentBodyType) => http.post<StartPaymentResType>(`${prefix}/${id}/pay`, body),
  confirm: (id: number) => http.post<OrderResType>(`${prefix}/${id}/confirm`, null),
  paymentMethods: () => http.get<PaymentMethodResType>(`payments/methods`)
}

export default orderApiRequest
