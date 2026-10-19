import http from '@/lib/http'
import { toQueryString } from '@/lib/utils'
import { CategoryListResType } from '@/schemaValidations/category.schema'
import { PaginationQueryType } from '@/schemaValidations/common.schema'

export const categoryApiRequest = {
  list: (query?: Partial<PaginationQueryType>) => http.get<CategoryListResType>(`/categories${toQueryString(query)}`)
}

export default categoryApiRequest
