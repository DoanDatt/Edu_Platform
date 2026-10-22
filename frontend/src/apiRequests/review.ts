import http from '@/lib/http'
import { toQueryString } from '@/lib/utils'
import { MessageResType } from '@/schemaValidations/common.schema'
import {
  CreateReviewBodyType,
  GetReviewsQueryType,
  MyReviewResType,
  ReviewListResType,
  ReviewResType,
  UpdateReviewBodyType
} from '@/schemaValidations/review.schema'

export const reviewApiRequest = {
  list: (query: Partial<GetReviewsQueryType> & { courseId: number }) =>
    http.get<ReviewListResType>(`/reviews${toQueryString(query)}`),
  getMine: (courseId: number) => http.get<MyReviewResType>(`/reviews/mine/${courseId}`),
  create: (body: CreateReviewBodyType) => http.post<ReviewResType>('/reviews', body),
  update: (reviewId: number, body: UpdateReviewBodyType) => http.put<ReviewResType>(`/reviews/${reviewId}`, body),
  delete: (reviewId: number) => http.delete<MessageResType>(`/reviews/${reviewId}`)
}

export default reviewApiRequest
