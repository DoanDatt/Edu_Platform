import http from '@/lib/http'
import { toQueryString } from '@/lib/utils'
import { PaginationQueryType } from '@/schemaValidations/common.schema'
import { RoleListResType } from '@/schemaValidations/role.schema'

export const roleApiRequest = {
  list: (query?: Partial<PaginationQueryType>) => http.get<RoleListResType>(`/roles${toQueryString(query)}`)
}
export default roleApiRequest
