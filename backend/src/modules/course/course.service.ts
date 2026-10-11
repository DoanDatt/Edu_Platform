import { CourseStatus } from '../../generated/prisma/enums'
import { Prisma } from '../../generated/prisma/client'
import prisma from '../../lib/prisma'
import { HttpError } from '../../utils/error'
import {
  CreateCourseBodyType,
  GetMyCoursesQueryType,
  GetPendingCoursesQueryType,
  UpdateCourseBodyType,
} from './course.schema'

// Trả khóa học thèm tên danh mục (chỉ id + name, không cần cả object category)
const courseInclude = {
  category: { select: { id: true, name: true } },
} as const

// chỉ sửa/xóa được khi khóa học còn ở tay giảng viên
// pending: đang chờ amdin duyệt -> khóa lại, tránh sửa giữa chừng
// published: đã có học viên thấy -> không cho sửa/xóa tự do
const EDITABLE_STATUSES: CourseStatus[] = [CourseStatus.DRAFT, CourseStatus.REJECTED]

export const getMyCourses = async (instructorId: number, { page, limit, status }: GetMyCoursesQueryType) => {
  // status không gửi -> undefined -> prisma bỏ qua điều kiện này (lấy mọi trạng thái)
  const where = { instructorId, status, deletedAt: null }

  const [totalItems, data] = await Promise.all([
    prisma.course.count({
      where,
    }),
    prisma.course.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updatedAt: 'desc' }, // khóa vừa sửa gần nhất cho lên đầu
      include: courseInclude,
    }),
  ])
  return { data, totalItems, page, limit, totalPages: Math.ceil(totalItems / limit) }
}

// Lấy khóa học + kiểm tra chủ sở hữu
// Dùng chung cho xem chi tiết, sửa, xóa
const getOwnCourse = async (courseId: number, instructorId: number) => {
  const course = await prisma.course.findFirst({
    where: { id: courseId, deletedAt: null },
    include: courseInclude,
  })
  if (!course) {
    throw new HttpError(404, 'Không tìm thấy khóa học')
  }
  // Có khóa học nhưng không phải của mình
  if (course.instructorId !== instructorId) {
    throw new HttpError(403, 'Bạn không phải giảng viên của khóa học này')
  }
  return course
}

export const getMyCourseById = getOwnCourse

const ensureCategoryExists = async (categoryId: number) => {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, deletedAt: null },
  })
  if (!category) {
    throw new HttpError(422, 'Dữ liệu không hợp lệ', [
      {
        field: 'categoryId',
        message: 'Danh mục không tồn tại',
      },
    ])
  }
}

export const createCourse = async (body: CreateCourseBodyType, instructorId: number) => {
  await ensureCategoryExists(body.categoryId)
  return prisma.course.create({
    // instructorId lấy từ token, không lấy từ body, status để DB tự gán DRAFT
    data: { ...body, instructorId },
    include: courseInclude,
  })
}

export const updateCourse = async (courseId: number, body: UpdateCourseBodyType, instructorId: number) => {
  const course = await getOwnCourse(courseId, instructorId)
  if (!EDITABLE_STATUSES.includes(course.status)) {
    throw new HttpError(409, `Không thể sửa khóa học đang ở trạng thái này ${course.status}`)
  }
  await ensureCategoryExists(body.categoryId) // có thể đổi sang danh mục khác
  return prisma.course.update({
    where: { id: courseId },
    data: body,
    include: courseInclude,
  })
}

export const deleteCourse = async (courseId: number, instructorId: number) => {
  const course = await getOwnCourse(courseId, instructorId)
  if (!EDITABLE_STATUSES.includes(course.status)) {
    throw new HttpError(409, `Không thể xóa khóa học đang ở trạng thái này ${course.status}`)
  }
  await prisma.course.update({
    where: { id: courseId },
    data: { deletedAt: new Date() },
  })
}

// ===== Luồng duyệt =====

// Chuyển trạng thái AN TOÀN: chỉ update khi trạng thái hiện tại nằm trong `from`.
// Điều kiện status nằm NGAY TRONG câu UPDATE → 2 request cùng lúc thì chỉ 1 cái thành công
// (cùng kỹ thuật với deleteMany + count ở refresh token)
const changeStatus = async (courseId: number, from: CourseStatus[], data: Prisma.CourseUpdateManyMutationInput) => {
  const { count } = await prisma.course.updateMany({
    where: { id: courseId, status: { in: from }, deletedAt: null },
    data,
  })

  // Không update được dòng nào → tìm lý do để báo lỗi rõ ràng (404 hay 409)
  if (count === 0) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
      select: { status: true },
    })
    if (!course) {
      throw new HttpError(404, 'Không tìm thấy khóa học')
    }
    throw new HttpError(409, `Không thể thực hiện khi khóa học đang ở trạng thái ${course.status}`)
  }

  return prisma.course.findFirstOrThrow({ where: { id: courseId }, include: courseInclude })
}

// Giảng viên gửi duyệt khóa của mình
export const submitCourse = async (courseId: number, instructorId: number) => {
  await getOwnCourse(courseId, instructorId) // 404 / 403
  return changeStatus(courseId, EDITABLE_STATUSES, {
    status: CourseStatus.PENDING,
    rejectReason: null, // gửi lại sau khi bị từ chối → xóa lý do cũ
  })
}

// Admin: danh sách chờ duyệt, gửi trước thì duyệt trước
export const getPendingCourses = async ({ page, limit }: GetPendingCoursesQueryType) => {
  const where = { status: CourseStatus.PENDING, deletedAt: null }
  const [totalItems, data] = await Promise.all([
    prisma.course.count({ where }),
    prisma.course.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updatedAt: 'asc' },
      include: {
        ...courseInclude,
        // Admin cần biết khóa này của giảng viên nào
        instructor: { select: { id: true, name: true, email: true } },
      },
    }),
  ])
  return { data, totalItems, page, limit, totalPages: Math.ceil(totalItems / limit) }
}

export const approveCourse = (courseId: number) =>
  changeStatus(courseId, [CourseStatus.PENDING], {
    status: CourseStatus.PUBLISHED,
    publishedAt: new Date(),
    rejectReason: null,
  })

export const rejectCourse = (courseId: number, reason: string) =>
  changeStatus(courseId, [CourseStatus.PENDING], {
    status: CourseStatus.REJECTED,
    rejectReason: reason,
  })
