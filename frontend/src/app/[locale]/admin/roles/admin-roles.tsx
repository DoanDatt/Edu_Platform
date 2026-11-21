'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RoleValues } from '@/constants/type'
import { cn } from '@/lib/utils'
import { useRolesQuery } from '@/queries/useRole'
import { Plus, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import RoleEditor from './role-editor'
import RoleFormDialog from './role-form-dialog'
import { roleLabel } from './role-utils'

// Bố cục 2 cột: trái = danh sách role, phải = sửa role đang chọn (tên, mô tả, bật / tắt, tick quyền)
export default function AdminRoles() {
  const rolesQuery = useRolesQuery()
  const roles = rolesQuery.data?.payload.data ?? []
  // Chưa chọn → mặc định role đầu tiên KHÔNG phải ADMIN (ADMIN chỉ xem được, không sửa)
  const [selectedId, setSelectedId] = useState<number | undefined>()
  const [creating, setCreating] = useState(false)
  const current =
    roles.find((role) => role.id === selectedId) ?? roles.find((role) => role.name !== RoleValues.Admin) ?? roles[0]

  if (rolesQuery.isLoading) {
    return (
      <div className='grid gap-4 lg:grid-cols-[280px_1fr]'>
        <Skeleton className='h-64 rounded-xl' />
        <Skeleton className='h-96 rounded-xl' />
      </div>
    )
  }
  if (rolesQuery.isError) {
    return (
      <p className='rounded-lg bg-destructive/10 p-4 text-sm text-destructive'>Không tải được danh sách vai trò.</p>
    )
  }

  return (
    <div className='grid items-start gap-4 lg:grid-cols-[280px_1fr]'>
      <aside className='flex flex-col gap-2 rounded-xl border bg-card p-3'>
        <ul className='flex flex-col gap-1' aria-label='Danh sách vai trò'>
          {roles.map((role) => (
            <li key={role.id}>
              <button
                type='button'
                onClick={() => setSelectedId(role.id)}
                aria-current={role.id === current?.id ? 'true' : undefined}
                className={cn(
                  'flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted',
                  role.id === current?.id && 'bg-primary/10 hover:bg-primary/10'
                )}
              >
                <ShieldCheck
                  className={cn(
                    'mt-0.5 size-4 shrink-0',
                    role.id === current?.id ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <span className='flex min-w-0 flex-1 flex-col'>
                  <span className='flex flex-wrap items-center gap-1.5 font-medium'>
                    {role.name}
                    {!role.isActive && <Badge variant='outline'>Đã tắt</Badge>}
                  </span>
                  <span className='truncate text-xs text-muted-foreground'>
                    {role.description || roleLabel(role.name)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <Button variant='outline' onClick={() => setCreating(true)}>
          <Plus />
          Tạo vai trò
        </Button>
      </aside>

      {/* key: đổi role → form mới với dữ liệu của role đó (không mang tick của role cũ sang) */}
      {current && <RoleEditor key={current.id} roleId={current.id} onDeleted={() => setSelectedId(undefined)} />}

      <RoleFormDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(id) => {
          setCreating(false)
          setSelectedId(id)
        }}
      />
    </div>
  )
}
