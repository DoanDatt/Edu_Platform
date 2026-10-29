'use client'

import { useAppContext } from '@/components/app-provider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { handleErrorApi } from '@/lib/utils'
import { useLogoutMutation, useMeQuery } from '@/queries/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { KeyRound, LogOut, ReceiptText, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const roleLabels: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  INSTRUCTOR: 'Giảng viên',
  STUDENT: 'Học viên'
}

// Ảnh + tên ở góc header, bấm vào sổ menu: Thông tin tài khoản, Đổi mật khẩu, Đăng xuất.
// Dùng chung cho header công khai, khu admin, khu giảng viên. Chưa đăng nhập thì không hiện gì
export default function AccountMenu() {
  const { isAuth, setRole } = useAppContext()
  const { data } = useMeQuery({ enabled: isAuth })
  const logoutMutation = useLogoutMutation()
  const queryClient = useQueryClient()
  const router = useRouter()

  if (!isAuth) return null

  const account = data?.payload.data
  // Chữ cái đầu của tên cuối, ví dụ "Nguyễn Văn An" → "A"
  const initial = account?.name.trim().split(/\s+/).pop()?.charAt(0).toUpperCase() ?? '?'

  const logout = async () => {
    if (logoutMutation.isPending) return
    try {
      await logoutMutation.mutateAsync()
      toast.success('Đăng xuất thành công')
    } catch (error) {
      // Route Handler luôn trả 200, chỉ lỗi khi mất mạng
      handleErrorApi({ error })
    } finally {
      // Dù gọi API thành công hay không, phía giao diện vẫn đăng xuất
      setRole() // role = undefined + xóa token trong localStorage → menu đổi về lúc chưa đăng nhập
      queryClient.clear() // xóa dữ liệu của người vừa đăng xuất còn trong cache (me, khóa học của tôi...)
      router.push('/')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type='button'
          className='flex items-center gap-3 rounded-full p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:rounded-md sm:px-2 sm:py-1 sm:hover:bg-accent'
          aria-label='Mở menu tài khoản'
        >
          <span className='hidden text-right leading-tight sm:block'>
            <span className='block text-sm font-medium'>{account?.name ?? '...'}</span>
            <span className='block text-xs text-muted-foreground'>{account ? roleLabels[account.role.name] : ''}</span>
          </span>
          <Avatar>
            <AvatarImage src={account?.avatar ?? undefined} alt={account?.name ?? 'Ảnh đại diện'} />
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      {/* align='end': menu canh theo mép phải nút, không tràn ra ngoài màn hình */}
      <DropdownMenuContent align='end' className='w-60'>
        <DropdownMenuLabel className='font-normal'>
          <p className='truncate text-sm font-medium'>{account?.name}</p>
          <p className='truncate text-xs text-muted-foreground'>{account?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* asChild: mục menu chính là thẻ <Link>, bấm là chuyển trang và menu tự đóng */}
        <DropdownMenuItem asChild>
          <Link href='/profile'>
            <UserRound />
            Thông tin tài khoản
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href='/my-orders'>
            <ReceiptText />
            Lịch sử mua hàng
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href='/profile/change-password'>
            <KeyRound />
            Đổi mật khẩu
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuItem variant='destructive' onSelect={logout} disabled={logoutMutation.isPending}>
          <LogOut />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
