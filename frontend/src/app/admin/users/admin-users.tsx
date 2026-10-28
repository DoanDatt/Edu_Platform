'use client'

import PaginationLinks from '@/components/pagination-links'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { RoleLabels, RoleType, UserStatus, UserStatusLabels } from '@/constants/type'
import { formatDate } from '@/lib/format'
import { cn, handleErrorApi } from '@/lib/utils'
import { useMeQuery } from '@/queries/useAuth'
import { useRolesQuery } from '@/queries/useRole'
import { useUpdateUserRoleMutation, useUpdateUserStatusMutation, useUsersQuery } from '@/queries/useUser'
import { GetUsersQuery, UserType } from '@/schemaValidations/user.schema'
import { Loader2, Lock, LockOpen, Search, UsersRound, X } from 'lucide-react'
import Form from 'next/form'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

const PAGE_SIZE = 10
const PATHNAME = '/admin/users'

// Tên vai trò tiếng Việt. Role lạ (admin tạo thêm sau này) không có trong RoleLabels → hiện nguyên tên
const roleLabel = (name: string) => RoleLabels[name as RoleType] ?? name

// Màu badge theo trạng thái: bị khóa màu đỏ, chưa kích hoạt chỉ có viền
const statusVariants: Record<keyof typeof UserStatus, 'secondary' | 'outline' | 'destructive'> = {
  ACTIVE: 'secondary',
  INACTIVE: 'outline',
  BLOCKED: 'destructive'
}

export default function AdminUsers() {
  const searchParams = useSearchParams()
  const router = useRouter()
  // ===== đọc bộ lọc trên URL =====

  const parsed = GetUsersQuery.safeParse({
    page: searchParams.get('page') ?? undefined,
    search: searchParams.get('search') ?? undefined,
    roleId: searchParams.get('roleId') ?? undefined,
    status: searchParams.get('status') ?? undefined
  })

  const page = parsed.success ? parsed.data.page : 1
  const search = parsed.success ? parsed.data.search : undefined
  const roleId = parsed.success ? parsed.data.roleId : undefined
  const status = parsed.success ? parsed.data.status : undefined

  // ===== lấy dữ liệu =====

  const { data, isLoading, isFetching, isError } = useUsersQuery({ page, roleId, search, status, limit: PAGE_SIZE })

  // ===== đổi bộ lọc trên URL =====

  const rolesQuery = useRolesQuery()
  const roles = rolesQuery.data?.payload.data ?? []

  const updateFilter = (key: 'roleId' | 'status', value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      // chỉ xóa 1 key
      params.delete(key)
    } else {
      params.set(key, value)
    }

    params.delete('page')

    const query = params.toString()
    router.push(query ? `${PATHNAME}?${query}` : PATHNAME)
  }
  // Xóa hết bộ lọc: về /admin/users
  const clearFilters = () => {
    router.push(PATHNAME)
  }
  const hasFilter = Boolean(search || roleId || status)

  // ===== biết mình là ai =====

  const meQuery = useMeQuery()
  const meId = meQuery.data?.payload.data.id // đang tải -> undefined -> chưa dòng nào là bạn

  const updateStatusMutation = useUpdateUserStatusMutation()
  const updateRoleMutation = useUpdateUserRoleMutation()

  // đang khóa / đổi vai trò -> khóa mọi nút và ô chọn, tránh bấm chồng
  const isUpdating = updateStatusMutation.isPending || updateRoleMutation.isPending

  // ===== khóa / mở tài khoản =====

  const toggleStatus = async (user: UserType) => {
    const willBlock = user.status !== 'BLOCKED'
    const nextStatus = willBlock ? UserStatus.BLOCKED : UserStatus.ACTIVE

    const message = willBlock
      ? `Khóa tài khoản "${user.name}"? Người này sẽ bị đăng xuất khỏi mọi thiết bị. `
      : `Mở khóa tài khoản "${user.name}"`

    if (!confirm(message)) return

    try {
      const result = await updateStatusMutation.mutateAsync({ id: user.id, body: { status: nextStatus } })
      toast.success(result.payload.message)
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  // ===== đổi vai trò =====

  const changeRole = async (user: UserType, newRoleId: string) => {
    const roleId = Number(newRoleId)

    if (roleId === user.role.id) return
    // tìm tên vai trò mới để câu hỏi dễ hiểu ("Học viên" thay vì "3")
    const newRole = roles.find((role) => role.id === roleId)
    if (!confirm(`Đổi vai trò của "${user.name}" thành "${roleLabel(newRole?.name ?? '')}"?`)) return

    try {
      const result = await updateRoleMutation.mutateAsync({ id: user.id, body: { roleId } })
      toast.success(result.payload.message)
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  return (
    <div className='flex flex-col gap-4'>
      {/* ===== Bộ lọc ===== */}
      <div className='flex flex-col gap-3 lg:flex-row lg:items-center'>
        {/* Form GET của Next: Enter → /admin/users?search=...; input ẩn giữ lại bộ lọc vai trò / trạng thái đang chọn.
            key: URL đổi (Back, Xóa bộ lọc) thì tạo lại ô nhập để chữ trong ô khớp URL */}
        <Form key={search ?? ''} action={PATHNAME} className='relative lg:w-80'>
          {roleId && <input type='hidden' name='roleId' value={roleId} />}
          {status && <input type='hidden' name='status' value={status} />}
          <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
          <input
            name='search'
            type='search'
            defaultValue={search ?? ''}
            placeholder='Tìm theo tên hoặc email...'
            aria-label='Tìm người dùng'
            className='h-9 w-full rounded-lg border bg-background pr-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
          />
        </Form>

        <div className='flex flex-wrap items-center gap-2'>
          <Select value={roleId ? String(roleId) : 'all'} onValueChange={(value) => updateFilter('roleId', value)}>
            <SelectTrigger className='w-40' aria-label='Lọc theo vai trò'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Mọi vai trò</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.id} value={String(role.id)}>
                  {roleLabel(role.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status ?? 'all'} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger className='w-44' aria-label='Lọc theo trạng thái'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Mọi trạng thái</SelectItem>
              {Object.values(UserStatus).map((value) => (
                <SelectItem key={value} value={value}>
                  {UserStatusLabels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilter && (
            <Button variant='ghost' size='sm' onClick={clearFilters}>
              <X />
              Xóa bộ lọc
            </Button>
          )}
          {isFetching && !isLoading && <Loader2 className='size-4 animate-spin text-muted-foreground' />}
        </div>
      </div>

      {/* ===== Bảng ===== */}
      {isLoading ? (
        <Skeleton className='h-96 w-full rounded-xl' />
      ) : isError || !data ? (
        <p className='rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive'>
          Không tải được danh sách người dùng. Vui lòng thử lại sau.
        </p>
      ) : data.payload.data.length === 0 ? (
        <div className='flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center'>
          <UsersRound className='size-10 text-muted-foreground' />
          <p className='font-medium'>Không tìm thấy người dùng phù hợp</p>
          {hasFilter && (
            <Button variant='outline' onClick={clearFilters}>
              Xóa bộ lọc
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className={cn('overflow-x-auto rounded-xl border transition-opacity', isFetching && 'opacity-60')}>
            <table className='w-full text-sm'>
              <thead className='bg-muted/40 text-left text-muted-foreground'>
                <tr>
                  <th className='px-4 py-3 font-medium'>Người dùng</th>
                  <th className='px-4 py-3 font-medium'>Vai trò</th>
                  <th className='px-4 py-3 font-medium'>Trạng thái</th>
                  <th className='px-4 py-3 font-medium'>Ngày tham gia</th>
                  <th className='px-4 py-3'>
                    <span className='sr-only'>Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.payload.data.map((user) => {
                  const isSelf = user.id === meId
                  const isBlocked = user.status === UserStatus.BLOCKED
                  return (
                    <tr key={user.id} className='border-t'>
                      <td className='px-4 py-3'>
                        <div className='flex items-center gap-3'>
                          <Avatar>
                            <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className='flex min-w-0 flex-col'>
                            <span className='flex items-center gap-2 font-medium'>
                              <span className='truncate'>{user.name}</span>
                              {isSelf && <Badge variant='outline'>Bạn</Badge>}
                            </span>
                            <span className='truncate text-xs text-muted-foreground'>{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className='px-4 py-3'>
                        {/* Đổi vai trò ngay trong bảng. Dòng của chính mình: chỉ hiện chữ, không cho đổi */}
                        {isSelf ? (
                          <span>{roleLabel(user.role.name)}</span>
                        ) : (
                          <Select
                            value={String(user.role.id)}
                            onValueChange={(value) => changeRole(user, value)}
                            disabled={isUpdating || roles.length === 0}
                          >
                            <SelectTrigger size='sm' className='w-36' aria-label={`Vai trò của ${user.name}`}>
                              {/* roles chưa tải xong thì SelectValue chưa có chữ → hiện tên vai trò hiện tại */}
                              <SelectValue placeholder={roleLabel(user.role.name)} />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map((role) => (
                                <SelectItem key={role.id} value={String(role.id)}>
                                  {roleLabel(role.name)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </td>
                      <td className='px-4 py-3'>
                        <Badge variant={statusVariants[user.status]}>{UserStatusLabels[user.status]}</Badge>
                      </td>
                      <td className='px-4 py-3 whitespace-nowrap text-muted-foreground'>
                        {formatDate(user.createdAt)}
                      </td>
                      <td className='px-4 py-3 text-right'>
                        {!isSelf && (
                          <Button
                            variant='outline'
                            size='sm'
                            disabled={isUpdating}
                            onClick={() => toggleStatus(user)}
                            className={cn(!isBlocked && 'text-destructive hover:text-destructive')}
                          >
                            {isBlocked ? <LockOpen /> : <Lock />}
                            {isBlocked ? 'Mở khóa' : 'Khóa'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <p className='text-sm text-muted-foreground'>Tổng {data.payload.totalItems} người dùng</p>
            <PaginationLinks
              pathname={PATHNAME}
              page={data.payload.page}
              totalPages={data.payload.totalPages}
              searchParams={Object.fromEntries(searchParams.entries())}
            />
          </div>
        </>
      )}
    </div>
  )
}
