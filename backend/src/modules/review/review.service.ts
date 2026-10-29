import prisma from '../../lib/prisma'
import { HttpError } from '../../utils/error'
import { RoleName } from '../../constants/role'
import { CourseStatus, NotificationType } from '../../generated/prisma/enums'
import { Prisma } from '../../generated/prisma/client'
import { AccessTokenPayload } from '../../utils/jwt'
import { isEnrolled } from '../enrollment/enrollment.service'
import { notifySafely } from '../notification/notification.service'
import {
  CreateReviewBodyType,
  GetFeaturedReviewsQueryType,
  GetReviewsQueryType,
  UpdateReviewBodyType,
} from './review.schema'

const reviewInclude = {
  user: { select: { id: true, name: true, avatar: true } },
} as const

// Điểm trung bình + số đánh giá cho NHIỀU khóa cùng lúc (dùng cho danh sách khóa học).
// groupBy: SQL GROUP BY courseId, tính AVG(rating) và COUNT(*) cho từng khóa
export const getRatingByCourse = async (courseIds: number[]) => {
  const result = new Map<number, { averageRating: number; totalReviews: number }>()
  if (courseIds.length === 0) return result

  const groups = await prisma.review.groupBy({
    by: ['courseId'],
    where: { courseId: { in: courseIds } },
    _avg: { rating: true },
    _count: { _all: true },
  })
  for (const group of groups) {
    result.set(group.courseId, {
      // Làm tròn 1 chữ số thập phân: 4.666 → 4.7
      averageRating: Math.round((group._avg.rating ?? 0) * 10) / 10,
      totalReviews: group._count._all,
    })
  }
  return result
}

// Tổng quan đánh giá của 1 khóa: trung bình, tổng số, và số lượng theo từng mức sao
export const getRatingSummary = async (courseId: number) => {
  const groups = await prisma.review.groupBy({
    by: ['rating'],
    where: { courseId },
    _count: { _all: true },
  })
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let totalReviews = 0
  let sum = 0
  for (const group of groups) {
    distribution[group.rating] = group._count._all
    totalReviews += group._count._all
    sum += group.rating * group._count._all
  }
  return {
    averageRating: totalReviews === 0 ? 0 : Math.round((sum / totalReviews) * 10) / 10,
    totalReviews,
    distribution,
  }
}

const ensurePublishedCourse = async (courseId: number) => {
  const course = await prisma.course.findFirst({
    where: { id: courseId, status: CourseStatus.PUBLISHED, deletedAt: null },
    select: { id: true },
  })
  if (!course) {
    throw new HttpError(404, 'Không tìm thấy khóa học')
  }
}

// Công khai: danh sách đánh giá của một khóa (mới nhất trước) + tổng quan
export const getReviews = async ({ courseId, page, limit }: GetReviewsQueryType) => {
  await ensurePublishedCourse(courseId)
  const where = { courseId }
  const [totalItems, data, summary] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: reviewInclude,
    }),
    getRatingSummary(courseId),
  ])
  return { data, summary, totalItems, page, limit, totalPages: Math.ceil(totalItems / limit) }
}

// Nhận xét ngắn quá ("hay", "ok") thì không đưa lên trang chủ
const FEATURED_MIN_COMMENT_LENGTH = 10

// Đánh giá nổi bật (trang chủ): 4–5 sao, có nhận xét đủ dài, thuộc khóa đang xuất bản.
// Mỗi người tối đa 1 đánh giá (không để 1 học viên chiếm hết khối). Mới nhất trước
export const getFeaturedReviews = async ({ limit }: GetFeaturedReviewsQueryType) => {
  // Lấy dư rồi lọc bằng JS: Prisma không lọc được theo độ dài chuỗi
  const reviews = await prisma.review.findMany({
    where: {
      rating: { gte: 4 },
      comment: { not: '' },
      course: { status: CourseStatus.PUBLISHED, deletedAt: null },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit * 5,
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: { select: { id: true, name: true, avatar: true } },
      course: { select: { id: true, title: true } },
    },
  })
  const seenUsers = new Set<number>()
  return reviews
    .filter((review) => {
      if (review.comment.trim().length < FEATURED_MIN_COMMENT_LENGTH || seenUsers.has(review.user.id)) return false
      seenUsers.add(review.user.id)
      return true
    })
    .slice(0, limit)
}

// Đánh giá của tôi cho 1 khóa (để frontend điền sẵn form sửa). Chưa đánh giá → null
export const getMyReview = (userId: number, courseId: number) =>
  prisma.review.findUnique({
    where: { userId_courseId: { userId, courseId } },
    include: reviewInclude,
  })

export const createReview = async ({ courseId, ...data }: CreateReviewBodyType, userId: number) => {
  await ensurePublishedCourse(courseId)
  // Phải học rồi mới được đánh giá
  if (!(await isEnrolled(userId, courseId))) {
    throw new HttpError(403, 'Bạn cần ghi danh khóa học trước khi đánh giá')
  }
  let review
  try {
    review = await prisma.review.create({
      data: { ...data, courseId, userId },
      include: reviewInclude,
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new HttpError(409, 'Bạn đã đánh giá khóa học này, hãy sửa đánh giá cũ')
    }
    throw error
  }

  // Báo giảng viên có đánh giá mới. Link /courses/:id: trang chi tiết tự chuyển sang URL chuẩn có tên khóa
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { title: true, instructorId: true },
  })
  if (course) {
    await notifySafely({
      userId: course.instructorId,
      type: NotificationType.NEW_REVIEW,
      title: 'Có đánh giá mới',
      message: `${review.user.name} đánh giá ${review.rating} sao cho khóa "${course.title}".`,
      link: `/courses/${courseId}`,
    })
  }
  return review
}

const getOwnReview = async (reviewId: number, userId: number) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } })
  if (!review) {
    throw new HttpError(404, 'Không tìm thấy đánh giá')
  }
  if (review.userId !== userId) {
    throw new HttpError(403, 'Đây không phải đánh giá của bạn')
  }
  return review
}

export const updateReview = async (reviewId: number, body: UpdateReviewBodyType, userId: number) => {
  await getOwnReview(reviewId, userId)
  return prisma.review.update({
    where: { id: reviewId },
    data: body,
    include: reviewInclude,
  })
}

// Người viết tự xóa, hoặc admin xóa (kiểm duyệt nội dung xấu)
export const deleteReview = async (reviewId: number, user: AccessTokenPayload) => {
  if (user.roleName === RoleName.Admin) {
    const { count } = await prisma.review.deleteMany({ where: { id: reviewId } })
    if (count === 0) {
      throw new HttpError(404, 'Không tìm thấy đánh giá')
    }
    return
  }
  await getOwnReview(reviewId, user.userId)
  await prisma.review.delete({ where: { id: reviewId } })
}
