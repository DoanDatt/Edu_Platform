import sectionApiRequest from '@/apiRequests/section'
import { UpdateSectionBodyType } from '@/schemaValidations/section.schema'
import { useMutation, useQueryClient } from '@tanstack/react-query'

// Không có query riêng cho chương: mục lục nằm trong chi tiết khóa ['courses', 'mine', id]
// → mọi thay đổi chương chỉ cần tải lại ['courses', 'mine'] (khớp cả chi tiết lẫn danh sách khóa của tôi)
const useInvalidateMyCourses = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['courses', 'mine'] })
}

export const useCreateSectionMutation = () => {
  const invalidate = useInvalidateMyCourses()
  return useMutation({
    mutationFn: sectionApiRequest.create,
    onSuccess: invalidate
  })
}

export const useUpdateSectionMutation = () => {
  const invalidate = useInvalidateMyCourses()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateSectionBodyType }) => sectionApiRequest.update(id, body),
    onSuccess: invalidate
  })
}

export const useDeleteSectionMutation = () => {
  const invalidate = useInvalidateMyCourses()
  return useMutation({
    mutationFn: sectionApiRequest.delete,
    onSuccess: invalidate
  })
}

export const useReorderSectionsMutation = () => {
  const invalidate = useInvalidateMyCourses()
  return useMutation({
    mutationFn: sectionApiRequest.reorder,
    onSuccess: invalidate
  })
}
