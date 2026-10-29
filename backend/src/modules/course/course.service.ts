import { CourseStatus, NotificationType } from '../../generated/prisma/enums'
import { Prisma } from '../../generated/prisma/client'
import prisma from '../../lib/prisma'
import { HttpError } from '../../utils/error'
import { enqueueEmailSafely } from '../../queues/email.queue'
import { courseApprovedEmail, courseRejectedEmail, EmailContent } from '../../emails/templates'
import { isEnrolled } from '../enrollment/enrollment.service'
import { NewNotification, notifyAdminsSafely, notifySafely } from '../notification/notification.service'
import { getRatingByCourse, getRatingSummary } from '../review/review.service'
import {
  CreateCourseBodyType,
  GetAdminCoursesQueryType,
  GetCourseStudentsQueryType,
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

// Khóa còn "ở tay giảng viên" (chưa từng / không còn công khai):
// được XÓA khóa và được GỬI DUYỆT
const DRAFT_STATUSES: CourseStatus[] = [CourseStatus.DRAFT, CourseStatus.REJECTED]

// Được SỬA nội dung (thông tin khóa, chương, bài giảng):
//  - DRAFT / REJECTED: đang soạn
//  - PUBLISHED: sửa lỗi, thêm bài mới cho học viên đang học (có hiệu lực ngay, không duyệt lại)
//  - PENDING: KHÔNG được sửa, để admin duyệt đúng bản đã gửi
const EDITABLE_STATUSES: CourseStatus[] = [...DRAFT_STATUSES, CourseStatus.PUBLISHED]

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

// Khóa của mình + đang ở trạng thái được sửa (DRAFT / REJECTED / PUBLISHED).
// Dùng cho sửa khóa học và mọi thao tác trên chương, bài giảng
export const getEditableOwnCourse = async (courseId: number, instructorId: number) => {
  const course = await getOwnCourse(courseId, instructorId)
  if (!EDITABLE_STATUSES.includes(course.status)) {
    throw new HttpError(409, `Không thể chỉnh sửa khóa học đang ở trạng thái ${course.status}`)
  }
  return course
}

// Khóa đã xuất bản (đang có học viên học) phải luôn còn ít nhất 1 bài giảng.
// Gọi TRƯỚC khi xóa chương / bài: `removing` mô tả các bài sắp bị xóa
export const ensurePublishedCourseKeepsLectures = async (courseId: number, removing: Prisma.LectureWhereInput) => {
  const course = await prisma.course.findUniqueOrThrow({ where: { id: courseId }, select: { status: true } })
  if (course.status !== CourseStatus.PUBLISHED) return
  const remaining = await prisma.lecture.count({
    where: { deletedAt: null, section: { courseId, deletedAt: null }, NOT: removing },
  })
  if (remaining === 0) {
    throw new HttpError(409, 'Khóa học đã xuất bản phải còn ít nhất 1 bài giảng')
  }
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
  const course = await getOwnCourse(courseId, instructorId)
  // Khóa đã xuất bản có học viên → không cho xóa (muốn ẩn thì nhờ admin gỡ)
  if (!DRAFT_STATUSES.includes(course.status)) {
    throw new HttpError(409, `Không thể xóa khóa học đang ở trạng thái ${course.status}`)
  }
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

// Số bài giảng còn hoạt động (trong chương còn hoạt động) của NHIỀU khóa cùng lúc, cho thẻ khóa học "12 bài học".
// Prisma không đếm lồng 2 tầng (khóa → chương → bài) được → lấy số bài của từng chương rồi cộng theo khóa
const countLecturesByCourse = async (courseIds: number[]) => {
  const result = new Map<number, number>()
  if (courseIds.length === 0) return result
  const sections = await prisma.section.findMany({
    where: { courseId: { in: courseIds }, deletedAt: null },
    select: { courseId: true, _count: { select: { lectures: { where: { deletedAt: null } } } } },
  })
  for (const section of sections) {
    result.set(section.courseId, (result.get(section.courseId) ?? 0) + section._count.lectures)
  }
  return result
}

export const getPublicCourses = async ({
  page,
  limit,
  search,
  categoryId,
  level,
  price,
  sort,
}: GetCoursesQueryType) => {
  // Lọc động: điều kiện nào không gửi thì để undefined → Prisma bỏ qua
  const where: Prisma.CourseWhereInput = {
    ...publicCourseWhere,
    categoryId,
    level,
    price: price === 'free' ? 0 : price === 'paid' ? { gt: 0 } : undefined,
    // Tìm trong tên HOẶC mô tả ngắn, không phân biệt hoa thường
    OR: search
      ? [{ title: { contains: search, mode: 'insensitive' } }, { subtitle: { contains: search, mode: 'insensitive' } }]
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

  // Điểm đánh giá + số bài học của cả trang, mỗi thứ 1 query (không lặp từng khóa)
  const courseIds = courses.map((c) => c.id)
  const [ratings, lectureCounts] = await Promise.all([getRatingByCourse(courseIds), countLecturesByCourse(courseIds)])
  const data = courses.map(({ _count, ...course }) => ({
    ...course,
    studentCount: _count.enrollments,
    totalLectures: lectureCounts.get(course.id) ?? 0,
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
  const course = await changeStatus(courseId, DRAFT_STATUSES, {
    status: CourseStatus.PENDING,
    rejectReason: null, // gửi lại sau khi bị từ chối → xóa lý do cũ
  })
  const instructor = await prisma.user.findUniqueOrThrow({ where: { id: instructorId }, select: { name: true } })
  await notifyAdminsSafely({
    type: NotificationType.COURSE_SUBMITTED,
    title: 'Có khóa học mới chờ duyệt',
    message: `${instructor.name} đã gửi duyệt khóa "${course.title}".`,
    link: `/admin/courses/${courseId}`,
  })
  return course
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

// Báo cho giảng viên của khóa: email (qua hàng đợi) + thông báo trong web (chuông).
// Cả hai đều 'Safely': lỗi chỉ ghi log, không ảnh hưởng thao tác duyệt
const notifyInstructor = async (
  courseId: number,
  buildEmail: (instructorName: string, courseTitle: string) => EmailContent,
  buildNotification: (courseTitle: string) => Omit<NewNotification, 'userId' | 'link'>,
) => {
  const course = await prisma.course.findUniqueOrThrow({
    where: { id: courseId },
    select: { title: true, instructorId: true, instructor: { select: { name: true, email: true } } },
  })
  await enqueueEmailSafely({ to: course.instructor.email, ...buildEmail(course.instructor.name, course.title) })
  await notifySafely({
    userId: course.instructorId,
    link: `/instructor/courses/${courseId}`, // trang soạn nội dung: thấy trạng thái + lý do từ chối
    ...buildNotification(course.title),
  })
}

export const approveCourse = async (courseId: number) => {
  const course = await changeStatus(courseId, [CourseStatus.PENDING], {
    status: CourseStatus.PUBLISHED,
    publishedAt: new Date(),
    rejectReason: null,
  })
  await notifyInstructor(
    courseId,
    (name, title) => courseApprovedEmail(name, title, courseId),
    (title) => ({
      type: NotificationType.COURSE_APPROVED,
      title: 'Khóa học đã được duyệt',
      message: `Khóa "${title}" đã được xuất bản trên trang công khai.`,
    }),
  )
  return course
}

export const rejectCourse = async (courseId: number, reason: string) => {
  const course = await changeStatus(courseId, [CourseStatus.PENDING], {
    status: CourseStatus.REJECTED,
    rejectReason: reason,
  })
  await notifyInstructor(
    courseId,
    (name, title) => courseRejectedEmail(name, title, reason, false),
    (title) => ({
      type: NotificationType.COURSE_REJECTED,
      title: 'Khóa học bị từ chối',
      message: `Khóa "${title}" bị từ chối. Lý do: ${reason}`,
    }),
  )
  return course
}

// Admin gỡ khóa đang công khai (vi phạm, nội dung sai...): PUBLISHED → REJECTED kèm lý do.
// Khóa biến mất khỏi trang công khai, học viên đã ghi danh tạm không vào học được.
// Giảng viên sửa xong gửi duyệt lại như bình thường
export const unpublishCourse = async (courseId: number, reason: string) => {
  const course = await changeStatus(courseId, [CourseStatus.PUBLISHED], {
    status: CourseStatus.REJECTED,
    rejectReason: reason,
  })
  await notifyInstructor(
    courseId,
    (name, title) => courseRejectedEmail(name, title, reason, true),
    (title) => ({
      type: NotificationType.COURSE_UNPUBLISHED,
      title: 'Khóa học bị gỡ khỏi trang công khai',
      message: `Khóa "${title}" đã bị gỡ. Lý do: ${reason}`,
    }),
  )
  return course
}

// ===== Admin: tất cả khóa học (mọi trạng thái, mọi giảng viên) =====

export const getAdminCourses = async ({
  page,
  limit,
  search,
  status,
  instructorId,
  categoryId,
}: GetAdminCoursesQueryType) => {
  const where: Prisma.CourseWhereInput = {
    deletedAt: null,
    status,
    instructorId,
    categoryId,
    OR: search ? [{ title: { contains: search, mode: 'insensitive' } }] : undefined,
  }
  const [totalItems, courses] = await Promise.all([
    prisma.course.count({ where }),
    prisma.course.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        ...courseInclude,
        instructor: { select: { id: true, name: true, email: true } },
        _count: { select: { enrollments: true } },
      },
    }),
  ])
  const data = courses.map(({ _count, ...course }) => ({ ...course, studentCount: _count.enrollments }))
  return { data, totalItems, page, limit, totalPages: Math.ceil(totalItems / limit) }
}

// ===== Giảng viên: học viên của khóa mình + tiến độ từng người =====

export const getCourseStudents = async (
  courseId: number,
  instructorId: number,
  { page, limit }: GetCourseStudentsQueryType,
) => {
  await getOwnCourse(courseId, instructorId) // 404 / 403

  const where = { courseId }
  const [totalItems, enrollments, totalLectures] = await Promise.all([
    prisma.enrollment.count({ where }),
    prisma.enrollment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    }),
    prisma.lecture.count({ where: { deletedAt: null, section: { courseId, deletedAt: null } } }),
  ])

  // Số bài đã xong của từng học viên trong trang này: 1 query GROUP BY userId
  const completedByUser = await prisma.lectureProgress.groupBy({
    by: ['userId'],
    where: {
      userId: { in: enrollments.map((e) => e.userId) },
      lecture: { deletedAt: null, section: { courseId, deletedAt: null } },
    },
    _count: { _all: true },
  })
  const completedMap = new Map(completedByUser.map((g) => [g.userId, g._count._all]))

  const data = enrollments.map((e) => {
    const completedLectures = completedMap.get(e.userId) ?? 0
    return {
      enrolledAt: e.createdAt,
      user: e.user,
      progress: {
        totalLectures,
        completedLectures,
        percent: totalLectures === 0 ? 0 : Math.round((completedLectures * 100) / totalLectures),
      },
    }
  })
  return { data, totalItems, page, limit, totalPages: Math.ceil(totalItems / limit) }
}
