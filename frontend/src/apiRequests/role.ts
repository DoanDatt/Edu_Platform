import http from '@/lib/http'
import { toQueryString } from '@/lib/utils'
import { MessageResType, PaginationQueryType } from '@/schemaValidations/common.schema'
import {
  CreateRoleBodyType,
  PermissionListResType,
  RoleDetailResType,
  RoleListResType,
  UpdateRoleBodyType
} from '@/schemaValidations/role.schema'

export const roleApiRequest = {
  list: (query?: Partial<PaginationQueryType>) => http.get<RoleListResType>(`/roles${toQueryString(query)}`),
  detail: (id: number) => http.get<RoleDetailResType>(`/roles/${id}`),
  create: (body: CreateRoleBodyType) => http.post<RoleDetailResType>('/roles', body),
  update: (id: number, body: UpdateRoleBodyType) => http.put<RoleDetailResType>(`/roles/${id}`, body),
  delete: (id: number) => http.delete<MessageResType>(`/roles/${id}`),
  // Toàn bộ permission (hiện ~50, backend cho tối đa 100 / trang)
  permissions: () => http.get<PermissionListResType>(`/permissions${toQueryString({ limit: 100 })}`)
}
export default roleApiRequest
