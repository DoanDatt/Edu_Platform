import http from '@/lib/http'
import { toQueryString } from '@/lib/utils'
import { GetReviewsQueryType, ReviewListResType } from '@/schemaValidations/review.schema'

const prefix = '/reviews'

// Mốc 2 chỉ cần đọc danh sách (trang chi tiết khóa học).
// Mốc 3 bổ sung: getMine, create, update, delete
const reviewApiRequest = {
  // GET /reviews?courseId&page&limit: courseId bắt buộc
  list: (query: Pick<GetReviewsQueryType, 'courseId'> & Partial<GetReviewsQueryType>) =>
    http.get<ReviewListResType>(`${prefix}${toQueryString(query)}`)
}

export default reviewApiRequest
