import lectureApiRequest from '@/apiRequests/lecture'
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
