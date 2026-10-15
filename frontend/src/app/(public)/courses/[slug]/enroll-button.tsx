'use client'

import { Button } from '@/components/ui/button'
import { HttpError } from '@/lib/http'
import { handleErrorApi } from '@/lib/utils'
import { useEnrollMutation } from '@/queries/useEnrollment'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Nút chính của trang chi tiết, theo isEnrolled backend trả về:
//   null  → khách chưa đăng nhập → "Đăng nhập để ghi danh"
//   false → đã đăng nhập, chưa ghi danh → "Ghi danh"
//   true  → đã ghi danh → "Vào học"
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
      <Button asChild size='lg' className='w-full'>
        <Link href='/login'>Đăng nhập để ghi danh</Link>
      </Button>
    )
  }

  if (isEnrolled) {
    return (
      <Button asChild size='lg' className='w-full'>
        <Link href={`/learn/${courseId}`}>Vào học</Link>
      </Button>
    )
  }

  const enroll = async () => {
    if (enrollMutation.isPending) return
    try {
      await enrollMutation.mutateAsync({ courseId })
      toast.success('Ghi danh thành công')
      // Tải lại dữ liệu của Server Component (vẫn ở trang này, không tải lại cả trang)
      // → backend trả isEnrolled: true → nút đổi thành "Vào học", số học viên tăng
      router.refresh()
    } catch (error) {
      // 402: khóa có phí, backend chưa hỗ trợ thanh toán
      if (error instanceof HttpError && error.status === 402) {
        toast.info(error.payload.message)
        return
      }
      // 409: đã ghi danh / là giảng viên của khóa, lỗi khác: toast
      handleErrorApi({ error })
    }
  }

  return (
    <Button size='lg' className='w-full' onClick={enroll} disabled={enrollMutation.isPending}>
      {enrollMutation.isPending && <Loader2 className='animate-spin' />}
      {price === 0 ? 'Ghi danh miễn phí' : 'Ghi danh'}
    </Button>
  )
}
