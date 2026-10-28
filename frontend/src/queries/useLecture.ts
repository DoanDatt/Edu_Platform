import lectureApiRequest from '@/apiRequests/lecture'
import { ReportWatchBodyType, UpdateLectureBodyType } from '@/schemaValidations/lecture.schema'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Nội dung 1 bài (video, ghi chú). lectureId có thể undefined lúc trang học mới mở
// (mục lục chưa tải xong, chưa biết đang học bài nào)
// → enabled: chưa có id thì CHƯA gọi API. Có id rồi React Query tự gọi (2 query phụ thuộc nhau)
export const useLectureQuery = (lectureId: number | undefined) => {
  return useQuery({
    queryKey: ['lectures', lectureId],
    queryFn: () => lectureApiRequest.getDetail(lectureId as number), // enabled đảm bảo lúc chạy đã có id
    enabled: Boolean(lectureId)
  })
}

// Bật / tắt "đã học" cho 1 bài. Gọi: mutateAsync({ lectureId: 21, completed: true })
//   completed: true  → POST   /lectures/21/complete  (đánh dấu đã học)
//   completed: false → DELETE /lectures/21/complete  (bỏ đánh dấu)
// id truyền lúc GỌI (mutateAsync), không truyền lúc tạo hook → 1 hook dùng cho mọi bài
export const useToggleLectureCompleteMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ lectureId, completed }: { lectureId: number; completed: boolean }) =>
      completed ? lectureApiRequest.complete(lectureId) : lectureApiRequest.uncomplete(lectureId),
    // Response chỉ có { lectureId, completed } → tải lại mục lục (dấu ✓, %) của trang học và /my-courses
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enrollments'] })
  })
}

// Trình phát báo tiến độ xem (~15 giây / lần). Gọi: mutate({ lectureId: 21, body: { playedSec, positionSec } })
// Chỉ khi backend báo vừa xem đủ (completed) mới tải lại mục lục: không thì cứ 15 giây lại tải lại 1 lần, phí
export const useReportWatchMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ lectureId, body }: { lectureId: number; body: ReportWatchBodyType }) =>
      lectureApiRequest.reportWatch(lectureId, body),
    onSuccess: (res) => {
      if (res.payload.data.completed) queryClient.invalidateQueries({ queryKey: ['enrollments'] })
    }
  })
}

// ===== Giảng viên soạn bài =====
// Giống useSection: bài giảng nằm trong mục lục của ['courses', 'mine', id] → tải lại cái đó.
// Thêm ['lectures']: nội dung bài (video, ghi chú) có thể đang được cache ở trang học /learn
const useInvalidateLectures = () => {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['courses', 'mine'] })
    queryClient.invalidateQueries({ queryKey: ['lectures'] })
  }
}

export const useCreateLectureMutation = () => {
  const invalidate = useInvalidateLectures()
  return useMutation({
    mutationFn: lectureApiRequest.create,
    onSuccess: invalidate
  })
}

export const useUpdateLectureMutation = () => {
  const invalidate = useInvalidateLectures()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateLectureBodyType }) => lectureApiRequest.update(id, body),
    onSuccess: invalidate
  })
}

export const useDeleteLectureMutation = () => {
  const invalidate = useInvalidateLectures()
  return useMutation({
    mutationFn: lectureApiRequest.delete,
    onSuccess: invalidate
  })
}

export const useReorderLecturesMutation = () => {
  const invalidate = useInvalidateLectures()
  return useMutation({
    mutationFn: lectureApiRequest.reorder,
    onSuccess: invalidate
  })
}
