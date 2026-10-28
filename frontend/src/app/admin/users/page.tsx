import { Skeleton } from '@/components/ui/skeleton'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import AdminUsers from './admin-users'

export const metadata: Metadata = {
  title: 'Người dùng'
}

// /admin/users?search=an&roleId=3&status=BLOCKED&page=2
export default function AdminUsersPage() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>Người dùng</h1>
        <p className='text-muted-foreground'>Tìm kiếm, khóa / mở tài khoản và đổi vai trò người dùng.</p>
      </div>
      {/* AdminUsers dùng useSearchParams (dữ liệu lúc chạy) → bọc Suspense */}
      <Suspense fallback={<Skeleton className='h-96 w-full rounded-xl' />}>
        <AdminUsers />
      </Suspense>
    </div>
  )
}
