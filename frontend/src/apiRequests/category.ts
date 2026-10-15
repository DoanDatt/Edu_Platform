import http from '@/lib/http'
import { toQueryString } from '@/lib/utils'
import {
  CategoryListResType,
  CategoryResType,
  CreateCategoryBodyType,
  GetCategoriesQueryType,
  UpdateCategoryBodyType
} from '@/schemaValidations/category.schema'
import { MessageResType } from '@/schemaValidations/common.schema'

const prefix = '/categories'

const categoryApiRequest = {
  // Công khai
  list: (query?: Partial<GetCategoriesQueryType>) => http.get<CategoryListResType>(`${prefix}${toQueryString(query)}`),
  getDetail: (id: number) => http.get<CategoryResType>(`${prefix}/${id}`),

  // Admin
  create: (body: CreateCategoryBodyType) => http.post<CategoryResType>(prefix, body),
  update: (id: number, body: UpdateCategoryBodyType) => http.put<CategoryResType>(`${prefix}/${id}`, body),
  delete: (id: number) => http.delete<MessageResType>(`${prefix}/${id}`)
}

export default categoryApiRequest
