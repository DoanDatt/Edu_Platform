import { CourseStatus } from '../../generated/prisma/enums'
import prisma from '../../lib/prisma'
import { HttpError } from '../../utils/error'
import { CreateCommentBodyType, GetCommentsQueryType } from './comment.schema'

// Bình luận dưới trang chi tiết khóa học (form "Leave A Comment" của EduPress).
// Khác đánh giá (review): không cần ghi danh, không chấm sao, khách cũng gửi được.
// Email chỉ để liên hệ → KHÔNG trả ra API công khai ("Your email address will not be published")
const commentSelect = {
  id: true,
  name: true,
  content: true,
  createdAt: true,
  user: { select: { id: true, avatar: true } },
} as const

// Chỉ bình luận được ở khóa đang hiển thị công khai
const ensurePublishedCourse = async (courseId: number) => {
  const course = await prisma.course.findFirst({
    where: { id: courseId, status: CourseStatus.PUBLISHED, deletedAt: null },
    select: { id: true },
  })
  if (!course) {
    throw new HttpError(404, 'Không tìm thấy khóa học')
  }
}

export const getComments = async (courseId: number, { page, limit }: GetCommentsQueryType) => {
  await ensurePublishedCourse(courseId)
  const where = { courseId, deletedAt: null }
  const [totalItems, data] = await Promise.all([
    prisma.courseComment.count({ where }),
    prisma.courseComment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: commentSelect,
    }),
  ])
  return { data, totalItems, page, limit, totalPages: Math.ceil(totalItems / limit) }
}

// userId có giá trị khi người gửi đang đăng nhập (optionalAuth) → tên / email lấy từ tài khoản, bỏ qua giá trị gửi lên
export const createComment = async (courseId: number, body: CreateCommentBodyType, userId?: number) => {
  await ensurePublishedCourse(courseId)

  let author: { name: string; email: string; userId: number | null }
  if (userId) {
    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null }, select: { name: true, email: true } })
    if (!user) throw new HttpError(401, 'Tài khoản không còn tồn tại')
    author = { ...user, userId }
  } else {
    // Khách: thiếu tên / email → báo lỗi đúng ô của form
    const errors = [
      ...(body.name ? [] : [{ field: 'name', message: 'Vui lòng nhập tên' }]),
      ...(body.email ? [] : [{ field: 'email', message: 'Vui lòng nhập email' }]),
    ]
    if (errors.length > 0) throw new HttpError(422, 'Dữ liệu không hợp lệ', errors)
    author = { name: body.name!, email: body.email!, userId: null }
  }

  return prisma.courseComment.create({
    data: { courseId, content: body.content, ...author },
    select: commentSelect,
  })
}
