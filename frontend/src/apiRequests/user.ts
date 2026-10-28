import http from '@/lib/http'
import { toQueryString } from '@/lib/utils'
import {
  GetUsersQueryType,
  UpdateUserRoleBodyType,
  UpdateUserStatusBodyType,
  UserListResType,
  UserResType
} from '@/schemaValidations/user.schema'

export const userApiRequest = {
  list: (query?: Partial<GetUsersQueryType>) => http.get<UserListResType>(`/users${toQueryString(query)}`),
  updateStatus: (id: number, body: UpdateUserStatusBodyType) => http.put<UserResType>(`/users/${id}/status`, body),
  updateRole: (id: number, body: UpdateUserRoleBodyType) => http.put<UserResType>(`/users/${id}/role`, body)
}

export default userApiRequest
