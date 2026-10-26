import { Badge } from '@/components/ui/badge'
import { CourseStatus, CourseStatusLabels } from '@/constants/type'

type CourseStatusType = keyof typeof CourseStatus

// Màu theo trạng thái: đã xuất bản nổi bật nhất, bị từ chối màu đỏ, nháp chỉ có viền
const variants: Record<CourseStatusType, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  DRAFT: 'outline',
  PENDING: 'secondary',
  PUBLISHED: 'default',
  REJECTED: 'destructive'
}

// Badge trạng thái khóa học (Nháp, Chờ duyệt...), dùng chung: dashboard, bảng khóa học, trang soạn bài
export default function CourseStatusBadge({ status }: { status: CourseStatusType }) {
  return <Badge variant={variants[status]}>{CourseStatusLabels[status]}</Badge>
}
