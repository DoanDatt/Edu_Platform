'use client'

import RatingStars from '@/components/rating-stars'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import { handleErrorApi } from '@/lib/utils'
import { useDeleteReviewMutation, useMyReviewQuery } from '@/queries/useReview'
import { Loader2, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import ReviewForm from './review-form'
import { useRouter } from '@/i18n/navigation'

// Khối "đánh giá của tôi" trên trang chi tiết. Chỉ hiện khi đã ghi danh (page.tsx kiểm tra isEnrolled).
//   chưa đánh giá → form viết mới
//   đã đánh giá   → thẻ đánh giá + nút Sửa (chuyển sang form, điền sẵn) / Xóa
export default function MyReview({ courseId }: { courseId: number }) {
  const router = useRouter()
  const myReviewQuery = useMyReviewQuery(courseId)
  const deleteMutation = useDeleteReviewMutation()
  const [isEditing, setIsEditing] = useState(false)

  if (myReviewQuery.isLoading) return <Skeleton className='h-40 w-full rounded-xl' />
  // Lỗi khi lấy đánh giá của tôi → ẩn khối, không làm hỏng trang chi tiết
  if (myReviewQuery.isError || !myReviewQuery.data) return null

  // MyReviewRes: data là review HOẶC null (chưa đánh giá)
  const myReview = myReviewQuery.data.payload.data

  const handleDelete = async () => {
    if (!myReview || deleteMutation.isPending) return
    // confirm(): hộp thoại có sẵn của trình duyệt. Sau này có thể đổi sang AlertDialog của shadcn cho đẹp
    if (!confirm('Xóa đánh giá của bạn cho khóa học này?')) return
    try {
      await deleteMutation.mutateAsync(myReview.id)
      toast.success('Đã xóa đánh giá')
      router.refresh() // danh sách + điểm trung bình (server) tính lại
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  return (
    <div className='flex flex-col gap-4 rounded-xl border bg-card p-5'>
      {myReview === null ? (
        // ===== Chưa đánh giá =====
        <>
          <h3 className='font-semibold'>Đánh giá khóa học</h3>
          <ReviewForm courseId={courseId} />
        </>
      ) : isEditing ? (
        // ===== Đang sửa: form điền sẵn dữ liệu cũ =====
        <>
          <h3 className='font-semibold'>Sửa đánh giá của bạn</h3>
          <ReviewForm courseId={courseId} review={myReview} onDone={() => setIsEditing(false)} />
        </>
      ) : (
        // ===== Đã đánh giá =====
        <>
          <div className='flex items-center justify-between gap-2'>
            <h3 className='font-semibold'>Đánh giá của bạn</h3>
            <div className='flex gap-1'>
              <Button variant='ghost' size='sm' onClick={() => setIsEditing(true)}>
                <Pencil />
                Sửa
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className='text-destructive hover:text-destructive'
              >
                {deleteMutation.isPending ? <Loader2 className='animate-spin' /> : <Trash2 />}
                Xóa
              </Button>
            </div>
          </div>
          <div className='flex items-center gap-3'>
            <RatingStars value={myReview.rating} />
            <span className='text-xs text-muted-foreground'>{formatDate(myReview.createdAt)}</span>
          </div>
          {myReview.comment && <p className='text-sm leading-relaxed text-muted-foreground'>{myReview.comment}</p>}
        </>
      )}
    </div>
  )
}
