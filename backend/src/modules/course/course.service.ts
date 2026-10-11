import { CourseStatus } from '../../generated/prisma/enums'
import prisma from '../../lib/prisma'
import { HttpError } from '../../utils/error'
import { CreateCourseBodyType, GetMyCoursesQueryType, UpdateCourseBodyType } from './course.schema'

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
