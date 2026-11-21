'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { RoleValues } from '@/constants/type'
import { cn, handleErrorApi } from '@/lib/utils'
import {
  useDeleteRoleMutation,
  usePermissionsQuery,
  useRoleDetailQuery,
  useUpdateRoleMutation
} from '@/queries/useRole'
import { PermissionType, RoleDetailResType } from '@/schemaValidations/role.schema'
import { Loader2, Lock, Save, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { SYSTEM_ROLES } from './role-utils'

// Nhóm quyền theo đoạn đầu của path ('/courses/:id' → 'courses'), kèm tên tiếng Việt
const GROUP_LABELS: Record<string, string> = {
  courses: 'Khóa học',
  sections: 'Chương',
  lectures: 'Bài giảng',
  enrollments: 'Ghi danh',
  reviews: 'Đánh giá',
  categories: 'Danh mục',
  users: 'Người dùng',
  roles: 'Vai trò',
  permissions: 'Quyền',
  stats: 'Thống kê',
  uploads: 'Upload'
}

// Màu theo HTTP method: nhìn lướt là biết quyền đọc (GET) hay ghi / xóa
const METHOD_CLASS: Record<string, string> = {
  GET: 'bg-sky-600/10 text-sky-700 dark:text-sky-400',
  POST: 'bg-green-600/10 text-green-700 dark:text-green-400',
  PUT: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  PATCH: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  DELETE: 'bg-destructive/10 text-destructive'
}

const groupOf = (permission: PermissionType) => permission.path.split('/')[1] || 'khác'

// Tải role + toàn bộ quyền rồi mới dựng form (form cần dữ liệu thật làm giá trị ban đầu)
export default function RoleEditor({ roleId, onDeleted }: { roleId: number; onDeleted: () => void }) {
  const roleQuery = useRoleDetailQuery(roleId)
  const permissionsQuery = usePermissionsQuery()

  if (roleQuery.isLoading || permissionsQuery.isLoading) return <Skeleton className='h-96 rounded-xl' />
  if (!roleQuery.data || !permissionsQuery.data) {
    return <p className='rounded-lg bg-destructive/10 p-4 text-sm text-destructive'>Không tải được vai trò.</p>
  }
  return (
    <RoleForm
      role={roleQuery.data.payload.data}
      permissions={permissionsQuery.data.payload.data}
      onDeleted={onDeleted}
    />
  )
}

function RoleForm({
  role,
  permissions,
  onDeleted
}: {
  role: RoleDetailResType['data']
  permissions: PermissionType[]
  onDeleted: () => void
}) {
  const updateMutation = useUpdateRoleMutation()
  const deleteMutation = useDeleteRoleMutation()
  // ADMIN luôn có TOÀN BỘ quyền (backend tự gán khi sync, cấm sửa tay để admin không tự khóa mình)
  const isAdmin = role.name === RoleValues.Admin
  // INSTRUCTOR / STUDENT: sửa được mô tả và quyền, không đổi tên / tắt / xóa
  const isSystem = SYSTEM_ROLES.includes(role.name)

  const [name, setName] = useState(role.name)
  const [description, setDescription] = useState(role.description)
  const [isActive, setIsActive] = useState(role.isActive)
  const initialIds = useMemo(() => new Set(role.permissions.map((p) => p.id)), [role.permissions])
  const [selected, setSelected] = useState<Set<number>>(() =>
    isAdmin ? new Set(permissions.map((p) => p.id)) : initialIds
  )

  // Gom quyền theo nhóm, giữ thứ tự xuất hiện
  const groups = useMemo(() => {
    const map = new Map<string, PermissionType[]>()
    for (const permission of permissions) {
      const key = groupOf(permission)
      map.set(key, [...(map.get(key) ?? []), permission])
    }
    return [...map.entries()]
  }, [permissions])

  const isDirty =
    name.trim().toUpperCase() !== role.name ||
    description.trim() !== role.description ||
    isActive !== role.isActive ||
    selected.size !== initialIds.size ||
    [...selected].some((id) => !initialIds.has(id))

  // Luôn tạo Set MỚI rồi mới set state (React so sánh tham chiếu)
  const toggle = (ids: number[], on: boolean) =>
    setSelected((current) => {
      const next = new Set(current)
      for (const id of ids) {
        if (on) next.add(id)
        else next.delete(id)
      }
      return next
    })

  const save = async () => {
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên vai trò')
      return
    }
    try {
      const result = await updateMutation.mutateAsync({
        id: role.id,
        body: {
          name: name.trim(),
          description: description.trim(),
          isActive,
          permissionIds: [...selected]
        }
      })
      toast.success(result.payload.message)
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  const remove = async () => {
    if (!confirm(`Xóa vai trò "${role.name}"?`)) return
    try {
      const result = await deleteMutation.mutateAsync(role.id)
      toast.success(result.payload.message)
      onDeleted()
    } catch (error) {
      // 409: còn người dùng thuộc vai trò này
      handleErrorApi({ error })
    }
  }

  return (
    <section className='flex flex-col gap-5 rounded-xl border bg-card p-4 md:p-6' aria-label={`Vai trò ${role.name}`}>
      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='role-name'>Tên vai trò</Label>
          <Input
            id='role-name'
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSystem}
            className='uppercase'
          />
          {isSystem && <p className='text-xs text-muted-foreground'>Vai trò hệ thống, không đổi tên được.</p>}
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='role-description'>Mô tả</Label>
          <Input
            id='role-description'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isAdmin}
          />
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <Checkbox
          id='role-active'
          checked={isActive}
          onCheckedChange={(checked) => setIsActive(checked === true)}
          disabled={isSystem}
        />
        <Label htmlFor='role-active'>Đang bật (tắt thì mọi người dùng thuộc vai trò này bị chặn gọi API)</Label>
      </div>

      {isAdmin && (
        <p className='flex items-center gap-2 rounded-lg bg-muted p-3 text-sm'>
          <Lock className='size-4 shrink-0' />
          ADMIN luôn có toàn bộ quyền và không sửa được, để quản trị viên không vô tình tự khóa mình.
        </p>
      )}

      <div className='flex flex-col gap-3'>
        <div className='flex items-center justify-between gap-2'>
          <h2 className='font-semibold'>Quyền</h2>
          <span className='text-sm text-muted-foreground'>
            Đã chọn {selected.size}/{permissions.length}
          </span>
        </div>
        <div className='grid gap-3 xl:grid-cols-2'>
          {groups.map(([key, items]) => {
            const ids = items.map((p) => p.id)
            const count = ids.filter((id) => selected.has(id)).length
            const groupId = `group-${key}`
            return (
              <fieldset key={key} className='rounded-lg border' disabled={isAdmin}>
                <legend className='sr-only'>{GROUP_LABELS[key] ?? key}</legend>
                <div className='flex items-center gap-2 border-b bg-muted/50 px-3 py-2'>
                  {/* Tick ô nhóm = chọn / bỏ cả nhóm. Chỉ tick khi đã chọn ĐỦ, chọn 1 phần thì xem số đếm bên phải */}
                  <Checkbox
                    id={groupId}
                    checked={count === ids.length}
                    onCheckedChange={(checked) => toggle(ids, checked === true)}
                    disabled={isAdmin}
                  />
                  <Label htmlFor={groupId} className='flex-1 font-medium'>
                    {GROUP_LABELS[key] ?? key}
                  </Label>
                  <span className={cn('text-xs tabular-nums', count > 0 ? 'text-primary' : 'text-muted-foreground')}>
                    {count}/{ids.length}
                  </span>
                </div>
                <ul className='flex flex-col'>
                  {items.map((permission) => {
                    const id = `permission-${permission.id}`
                    return (
                      <li key={permission.id} className='flex items-center gap-2 px-3 py-1.5'>
                        <Checkbox
                          id={id}
                          checked={selected.has(permission.id)}
                          onCheckedChange={(checked) => toggle([permission.id], checked === true)}
                          disabled={isAdmin}
                        />
                        <Label htmlFor={id} className='flex min-w-0 flex-1 items-center gap-2 font-normal'>
                          <Badge
                            variant='secondary'
                            className={cn('w-16 justify-center font-mono text-[11px]', METHOD_CLASS[permission.method])}
                          >
                            {permission.method}
                          </Badge>
                          <code className='truncate text-xs'>{permission.path}</code>
                        </Label>
                      </li>
                    )
                  })}
                </ul>
              </fieldset>
            )
          })}
        </div>
      </div>

      {!isAdmin && (
        <div className='sticky bottom-0 -mx-4 flex flex-wrap items-center gap-2 border-t bg-card px-4 pt-4 md:-mx-6 md:px-6'>
          {!isSystem && (
            <Button variant='outline' onClick={remove} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className='animate-spin' /> : <Trash2 />}
              Xóa vai trò
            </Button>
          )}
          <span className='ml-auto text-sm text-muted-foreground'>{isDirty ? 'Có thay đổi chưa lưu' : ''}</span>
          <Button onClick={save} disabled={!isDirty || updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className='animate-spin' /> : <Save />}
            Lưu thay đổi
          </Button>
        </div>
      )}
    </section>
  )
}
