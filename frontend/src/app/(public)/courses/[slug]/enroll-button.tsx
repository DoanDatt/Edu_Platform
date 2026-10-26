'use client'

import { Button } from '@/components/ui/button'
import { HttpError } from '@/lib/http'
import { handleErrorApi } from '@/lib/utils'
import { useEnrollMutation } from '@/queries/useEnrollments'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Nút chính của trang chi tiết, theo isEnrolled backend trả về:
//   null  → khách chưa đăng nhập   → "Đăng nhập để ghi danh" (link sang /login)
//   true  → đã ghi danh            → "Vào học" (link sang /learn/:id, trang này làm ở Mốc 3)
//   false → đã đăng nhập, chưa ghi danh → nút "Ghi danh" (gọi API)
// Client Component vì có onClick + hook (useMutation, useRouter)
export default function EnrollButton({
  courseId,
  isEnrolled,
  price
}: {
  courseId: number
  isEnrolled: boolean | null
  price: number
}) {
  const enrollMutation = useEnrollMutation()
  const router = useRouter()

  if (isEnrolled === null) {
    return (
      <Button asChild size='lg' className='h-11 w-full rounded-full text-base'>
        <Link href='/login'>Đăng nhập để ghi danh</Link>
      </Button>
    )
  }

  if (isEnrolled) {
    return (
      <Button asChild size='lg' className='h-11 w-full rounded-full text-base'>
        <Link href={`/learn/${courseId}`}>Vào học</Link>
      </Button>
    )
  }

  const enroll = async () => {
    // Đang gọi API rồi thì bỏ qua (chặn bấm 2 lần liên tiếp tạo 2 request)
    if (enrollMutation.isPending) return
    try {
      await enrollMutation.mutateAsync({ courseId })
      toast.success('Ghi danh thành công')
      // router.refresh(): chạy lại Server Component của trang này (KHÔNG tải lại cả trang)
      // → getDetail trả isEnrolled: true → nút đổi thành "Vào học", số học viên +1
      router.refresh()
    } catch (error) {
      // 402: khóa có phí, backend chưa làm thanh toán → báo THÔNG TIN (không phải lỗi đỏ)
      if (error instanceof HttpError && error.status === 402) {
        toast.info(error.payload.message)
        return
      }
      // Lỗi khác (409 đã ghi danh / là giảng viên của khóa, mất mạng...) → toast lỗi
      handleErrorApi({ error })
    }
  }

  return (
    <Button size='lg' className='h-11 w-full rounded-full text-base' onClick={enroll} disabled={enrollMutation.isPending}>
      {enrollMutation.isPending && <Loader2 className='animate-spin' />}
      {price === 0 ? 'Ghi danh miễn phí' : 'Ghi danh'}
    </Button>
  )
}
