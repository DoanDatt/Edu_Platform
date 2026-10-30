import commentApiRequest from '@/apiRequests/comment'
import contactApiRequest from '@/apiRequests/contact'
import { CreateCommentBodyType } from '@/schemaValidations/comment.schema'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Bình luận của 1 khóa, theo trang. keepPreviousData: chuyển trang thì giữ danh sách cũ tới khi trang mới về
// (không nháy trắng)
export const useCommentsQuery = (courseId: number, page: number) => {
  return useQuery({
    queryKey: ['comments', courseId, page],
    queryFn: () => commentApiRequest.list(courseId, { page, limit: 5 }),
    placeholderData: keepPreviousData
  })
}

// Gửi xong → tải lại danh sách bình luận của khóa đó
export const useCreateCommentMutation = (courseId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateCommentBodyType) => commentApiRequest.create(courseId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', courseId] })
  })
}

// Form trang Liên hệ
export const useSendContactMutation = () => {
  return useMutation({ mutationFn: contactApiRequest.send })
}
