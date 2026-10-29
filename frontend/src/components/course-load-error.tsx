import { Button } from '@/components/ui/button'
import { HttpError } from '@/lib/http'
import { Link } from '@/i18n/navigation'

// Lỗi khi tải 1 khóa theo id (giảng viên: sửa thông tin, soạn nội dung; admin: xem để duyệt).
// HttpError có status → báo đúng lý do thay vì một câu chung chung
export default function CourseLoadError({
  error,
  backHref = '/instructor/courses'
}: {
  error: unknown
  backHref?: string // nút quay lại: danh sách khóa của khu đang đứng
}) {
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
        <Link href={backHref}>Về danh sách khóa học</Link>
      </Button>
    </div>
  )
}
