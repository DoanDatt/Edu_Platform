import { Button } from '@/components/ui/button'
import { HttpError } from '@/lib/http'
import Link from 'next/link'

// Lỗi khi tải 1 khóa của giảng viên (trang sửa thông tin, trang soạn nội dung)
// HttpError có status → báo đúng lý do thay vì một câu chung chung
export default function CourseLoadError({ error }: { error: unknown }) {
  const status = error instanceof HttpError ? error.status : undefined
  const message =
    status === 404
      ? 'Không tìm thấy khóa học.'
      : status === 403
        ? 'Đây không phải khóa học của bạn.'
        : 'Không tải được khóa học. Vui lòng thử lại sau.'
  return (
    <div className='flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4'>
      <p className='text-sm text-destructive'>{message}</p>
      <Button asChild variant='outline' size='sm'>
        <Link href='/instructor/courses'>Về danh sách khóa học</Link>
      </Button>
    </div>
  )
}
