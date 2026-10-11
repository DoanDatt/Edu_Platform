import { CourseStatus } from '../../generated/prisma/enums'
import { Prisma } from '../../generated/prisma/client'
import prisma from '../../lib/prisma'
import { HttpError } from '../../utils/error'
import { isEnrolled } from '../enrollment/enrollment.service'
import { getRatingByCourse, getRatingSummary } from '../review/review.service'
import {
  CreateCourseBodyType,
  GetCoursesQueryType,
  GetMyCoursesQueryType,
  GetPendingCoursesQueryType,
  UpdateCourseBodyType,
} from './course.schema'

// Trả khóa học kèm tên danh mục (chỉ id + name, không cần cả object category)
const courseInclude = {
  category: { select: { id: true, name: true } },
} as const

// Mục lục ĐẦY ĐỦ (giảng viên / admin xem): chương + bài giảng chưa xóa, theo đúng thứ tự
const curriculumInclude = {
  sections: {
    where: { deletedAt: null },
    orderBy: [{ position: 'asc' }, { id: 'asc' }],
    include: {
      lectures: {
        where: { deletedAt: null },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
      },
    },
  },
} satisfies Prisma.CourseInclude

// chỉ sửa/xóa được khi khóa học còn ở tay giảng viên
// pending: đang chờ admin duyệt -> khóa lại, tránh sửa giữa chừng
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

// Khóa của mình + còn ở trạng thái được sửa (DRAFT / REJECTED).
// Dùng cho sửa/xóa khóa học và mọi thao tác trên chương, bài giảng
export const getEditableOwnCourse = async (courseId: number, instructorId: number) => {
  const course = await getOwnCourse(courseId, instructorId)
  if (!EDITABLE_STATUSES.includes(course.status)) {
    throw new HttpError(409, `Không thể chỉnh sửa khóa học đang ở trạng thái ${course.status}`)
  }
  return course
}

// Chi tiết khóa của mình, kèm mục lục đầy đủ để giảng viên soạn bài
export const getMyCourseById = async (courseId: number, instructorId: number) => {
  await getOwnCourse(courseId, instructorId) // 404 / 403
  return prisma.course.findFirstOrThrow({
    where: { id: courseId },
    include: { ...courseInclude, ...curriculumInclude },
  })
}

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
  await getEditableOwnCourse(courseId, instructorId) // 404 / 403 / 409
  await ensureCategoryExists(body.categoryId) // có thể đổi sang danh mục khác
  return prisma.course.update({
    where: { id: courseId },
    data: body,
    include: courseInclude,
  })
}

export const deleteCourse = async (courseId: number, instructorId: number) => {
  await getEditableOwnCourse(courseId, instructorId)
  await prisma.course.update({
    where: { id: courseId },
    data: { deletedAt: new Date() },
  })
}

// ===== Công khai: khóa học đã xuất bản =====

const publicCourseWhere = { status: CourseStatus.PUBLISHED, deletedAt: null }

// Thông tin hiển thị trên thẻ khóa học (danh sách) và đầu trang chi tiết
const publicCourseSelect = {
  id: true,
  title: true,
  subtitle: true,
  thumbnail: true,
  price: true,
  level: true,
  language: true,
  publishedAt: true,
  category: { select: { id: true, name: true } },
  instructor: { select: { id: true, name: true, avatar: true } },
  _count: { select: { enrollments: true } }, // số học viên
} satisfies Prisma.CourseSelect

// Mỗi kiểu sort → orderBy của Prisma. Thêm id để thứ tự luôn ổn định khi giá trị bằng nhau
const SORT_ORDER: Record<GetCoursesQueryType['sort'], Prisma.CourseOrderByWithRelationInput[]> = {
  newest: [{ publishedAt: 'desc' }, { id: 'desc' }],
  popular: [{ enrollments: { _count: 'desc' } }, { id: 'desc' }],
  price_asc: [{ price: 'asc' }, { id: 'desc' }],
  price_desc: [{ price: 'desc' }, { id: 'desc' }],
}

export const getPublicCourses = async ({ page, limit, search, categoryId, level, price, sort }: GetCoursesQueryType) => {
  // Lọc động: điều kiện nào không gửi thì để undefined → Prisma bỏ qua
  const where: Prisma.CourseWhereInput = {
    ...publicCourseWhere,
    categoryId,
    level,
    price: price === 'free' ? 0 : price === 'paid' ? { gt: 0 } : undefined,
    // Tìm trong tên HOẶC mô tả ngắn, không phân biệt hoa thường
    OR: search
      ? [
          { title: { contains: search, mode: 'insensitive' } },
          { subtitle: { contains: search, mode: 'insensitive' } },
        ]
      : undefined,
  }

  const [totalItems, courses] = await Promise.all([
    prisma.course.count({ where }),
    prisma.course.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: SORT_ORDER[sort],
      select: publicCourseSelect,
    }),
  ])

  // Điểm đánh giá của cả trang trong 1 query (groupBy)
  const ratings = await getRatingByCourse(courses.map((c) => c.id))
  const data = courses.map(({ _count, ...course }) => ({
    ...course,
    studentCount: _count.enrollments,
    rating: ratings.get(course.id) ?? { averageRating: 0, totalReviews: 0 },
  }))
  return { data, totalItems, page, limit, totalPages: Math.ceil(totalItems / limit) }
}

// Trang chi tiết công khai. userId có giá trị khi người xem đã đăng nhập (optionalAuth)
export const getPublicCourseById = async (courseId: number, userId?: number) => {
  const course = await prisma.course.findFirst({
    where: { id: courseId, ...publicCourseWhere },
    select: {
      ...publicCourseSelect,
      description: true,
      sections: {
        where: { deletedAt: null },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          title: true,
          lectures: {
            where: { deletedAt: null },
            orderBy: [{ position: 'asc' }, { id: 'asc' }],
            // Không trả content; videoUrl chỉ trả cho bài xem thử (xử lý bên dưới)
            select: { id: true, title: true, durationSec: true, isPreview: true, videoUrl: true },
          },
        },
      },
    },
  })
  if (!course) {
    throw new HttpError(404, 'Không tìm thấy khóa học')
  }

  const [rating, enrolled] = await Promise.all([
    getRatingSummary(courseId),
    userId ? isEnrolled(userId, courseId) : Promise.resolve(false),
  ])

  // Tổng số bài + tổng thời lượng để hiện "12 bài giảng • 3 giờ 20 phút"
  let totalLectures = 0
  let totalDurationSec = 0
  const sections = course.sections.map((section) => ({
    ...section,
    lectures: section.lectures.map(({ videoUrl, ...lecture }) => {
      totalLectures++
      totalDurationSec += lecture.durationSec
      // Bài không phải xem thử → ẩn link video (phải ghi danh rồi lấy qua GET /lectures/:id)
      return { ...lecture, videoUrl: lecture.isPreview ? videoUrl : null }
    }),
  }))

  const { _count, ...rest } = course
  return {
    ...rest,
    sections,
    studentCount: _count.enrollments,
    totalLectures,
    totalDurationSec,
    rating,
    // null = khách chưa đăng nhập; true/false = đã đăng nhập, đã ghi danh hay chưa
    isEnrolled: userId ? enrolled : null,
  }
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
  // Khóa rỗng thì không có gì để duyệt
  const lectureCount = await prisma.lecture.count({
    where: { deletedAt: null, section: { courseId, deletedAt: null } },
  })
  if (lectureCount === 0) {
    throw new HttpError(409, 'Khóa học cần có ít nhất 1 bài giảng trước khi gửi duyệt')
  }
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

// Admin xem chi tiết một khóa ở BẤT KỲ trạng thái nào (để duyệt): kèm giảng viên + mục lục
export const getCourseForAdmin = async (courseId: number) => {
  const course = await prisma.course.findFirst({
    where: { id: courseId, deletedAt: null },
    include: {
      ...courseInclude,
      ...curriculumInclude,
      instructor: { select: { id: true, name: true, email: true } },
    },
  })
  if (!course) {
    throw new HttpError(404, 'Không tìm thấy khóa học')
  }
  return course
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
