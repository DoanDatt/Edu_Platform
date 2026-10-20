import http from '@/lib/http'
import { toQueryString } from '@/lib/utils'
import { GetReviewsQueryType, ReviewListResType } from '@/schemaValidations/review.schema'

export const reviewApiRequest = {
  list: (query: Partial<GetReviewsQueryType> & { courseId: number }) =>
    http.get<ReviewListResType>(`/reviews${toQueryString(query)}`)
}

export default reviewApiRequest
