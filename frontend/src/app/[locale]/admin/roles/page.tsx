import type { Metadata } from 'next'
import AdminRoles from './admin-roles'

export const metadata: Metadata = {
  title: 'Phân quyền'
}

// /admin/roles: role (vai trò) + quyền (permission) của từng role
export default function AdminRolesPage() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>Phân quyền</h1>
        <p className='text-muted-foreground'>
          Mỗi người dùng thuộc 1 vai trò. Vai trò được gọi API nào thì tick quyền đó. Quyền được tạo tự động từ code
          backend.
        </p>
      </div>
      <AdminRoles />
    </div>
  )
}
