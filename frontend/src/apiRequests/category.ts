import http from '@/lib/http'
import { toQueryString } from '@/lib/utils'
import {
  CategoryListResType,
  CategoryResType,
  CreateCategoryBodyType,
  UpdateCategoryBodyType
} from '@/schemaValidations/category.schema'
import { MessageResType, PaginationQueryType } from '@/schemaValidations/common.schema'

export const categoryApiRequest = {
  list: (query?: Partial<PaginationQueryType>) => http.get<CategoryListResType>(`/categories${toQueryString(query)}`),
  create: (body: CreateCategoryBodyType) => http.post<CategoryResType>('/categories', body),
  update: (id: number, body: UpdateCategoryBodyType) => http.put<CategoryResType>(`/categories/${id}`, body),
  delete: (id: number) => http.delete<MessageResType>(`/categories/${id}`)
}

export default categoryApiRequest
