import roleApiRequest from '@/apiRequests/role'
import { UpdateRoleBodyType } from '@/schemaValidations/role.schema'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Danh sách role (trang người dùng: lọc / đổi role; trang phân quyền)
export const useRolesQuery = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => roleApiRequest.list({ limit: 100 })
  })
}

// enabled: chưa chọn role nào thì chưa gọi
export const useRoleDetailQuery = (id: number | undefined) => {
  return useQuery({
    queryKey: ['roles', id],
    queryFn: () => roleApiRequest.detail(id as number),
    enabled: Boolean(id)
  })
}

// Permission gần như không đổi lúc đang dùng (chỉ đổi khi deploy + sync) → giữ cache lâu
export const usePermissionsQuery = () => {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: roleApiRequest.permissions,
    staleTime: 10 * 60 * 1000
  })
}

// Mọi thay đổi role → tải lại danh sách + chi tiết (prefix ['roles'] khớp cả 2)
export const useCreateRoleMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: roleApiRequest.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] })
  })
}

export const useUpdateRoleMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateRoleBodyType }) => roleApiRequest.update(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] })
  })
}

export const useDeleteRoleMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: roleApiRequest.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] })
  })
}
