import prisma from '../../lib/prisma'
import { HttpError } from '../../utils/error'
import { CourseStatus, NotificationType } from '../../generated/prisma/enums'
import { Prisma } from '../../generated/prisma/client'
import { notifySafely } from '../notification/notification.service'
import { CreateEnrollmentBodyType, GetMyEnrollmentsQueryType } from './enrollment.schema'

export const isEnrolled = async (userId: number, courseId: number) => {
  const enrollment = await prisma.enrollment.findUnique({
    // @@unique([userId, courseId]) → Prisma sinh ra khóa tìm kiếm tên userId_courseId
    where: { userId_courseId: { userId, courseId } },
  })
  return enrollment !== null
}

export const enroll = async ({ courseId }: CreateEnrollmentBodyType, userId: number) => {
  const course = await prisma.course.findFirst({
    where: { id: courseId, status: CourseStatus.PUBLISHED, deletedAt: null },
  })
  if (!course) {
    throw new HttpError(404, 'Không tìm thấy khóa học')
  }
  if (course.instructorId === userId) {
    throw new HttpError(409, 'Bạn là giảng viên của khóa học này')
  }
  if (course.price > 0) {
    // 402 Payment Required: khóa có phí phải mua qua đơn hàng (POST /orders), thanh toán xong tự ghi danh
    throw new HttpError(402, 'Khóa học có phí, vui lòng mua khóa học')
  }

  let enrollment
  try {
    enrollment = await prisma.enrollment.create({ data: { userId, courseId } })
  } catch (error) {
    // P2002: vi phạm @@unique([userId, courseId]) → đã ghi danh rồi.
    // Để DB chặn trùng (thay vì findUnique trước) thì 2 request cùng lúc cũng không tạo được 2 dòng
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new HttpError(409, 'Bạn đã ghi danh khóa học này')
    }
    throw error
  }

  // Báo giảng viên có học viên mới. Đặt NGOÀI try ở trên: lỗi ở đây không bị nhầm thành lỗi ghi danh
  const student = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
  await notifySafely({
    userId: course.instructorId,
    type: NotificationType.NEW_ENROLLMENT,
    title: 'Có học viên mới',
    message: `${student?.name ?? 'Một học viên'} đã ghi danh khóa "${course.title}".`,
    link: `/instructor/courses/${courseId}/students`,
  })
  return enrollment
}

type ProgressCount = { totalLectures: number; completedLectures: number }

const toProgress = ({ totalLectures, completedLectures }: ProgressCount) => ({
  totalLectures,
  completedLectures,
  percent: totalLectures === 0 ? 0 : Math.round((completedLectures * 100) / totalLectures),
})

// Đếm tổng số bài + số bài đã xong cho NHIỀU khóa cùng lúc (2 query, không lặp từng khóa)
const countProgressByCourse = async (userId: number, courseIds: number[]) => {
  const result = new Map<number, ProgressCount>()
  for (const id of courseIds) {
    result.set(id, { totalLectures: 0, completedLectures: 0 })
  }
  if (courseIds.length === 0) return result

  // Chỉ tính bài giảng còn hoạt động trong chương còn hoạt động
  const activeLectureWhere = { deletedAt: null, section: { deletedAt: null, courseId: { in: courseIds } } }
  const [lectures, completed] = await Promise.all([
    prisma.lecture.findMany({
      where: activeLectureWhere,
      select: { section: { select: { courseId: true } } },
    }),
    prisma.lectureProgress.findMany({
      where: { userId, lecture: activeLectureWhere },
      select: { lecture: { select: { section: { select: { courseId: true } } } } },
    }),
  ])
  for (const lecture of lectures) {
    result.get(lecture.section.courseId)!.totalLectures++
  }
  for (const progress of completed) {
    result.get(progress.lecture.section.courseId)!.completedLectures++
  }
  return result
}

// "Khóa học của tôi" phía học viên: khóa đã ghi danh + % tiến độ
export const getMyEnrollments = async (userId: number, { page, limit }: GetMyEnrollmentsQueryType) => {
  const where = { userId, course: { deletedAt: null } }
  const [totalItems, enrollments] = await Promise.all([
    prisma.enrollment.count({ where }),
    prisma.enrollment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            subtitle: true,
            thumbnail: true,
            level: true,
            // Frontend vẽ ảnh bìa theo danh mục khi khóa chưa có thumbnail
            category: { select: { id: true, name: true } },
            instructor: { select: { id: true, name: true } },
          },
        },
      },
    }),
  ])

  const progress = await countProgressByCourse(
    userId,
    enrollments.map((e) => e.courseId),
  )
  const data = enrollments.map((e) => ({
    enrolledAt: e.createdAt,
    course: e.course,
    progress: toProgress(progress.get(e.courseId)!),
  }))
  return { data, totalItems, page, limit, totalPages: Math.ceil(totalItems / limit) }
}

// Trang học một khóa: mục lục (không kèm nội dung bài) + bài nào đã xong + % tiến độ.
// Nội dung từng bài lấy riêng qua GET /lectures/:lectureId
export const getMyLearning = async (userId: number, courseId: number) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  })
  if (!enrollment) {
    throw new HttpError(403, 'Bạn chưa ghi danh khóa học này')
  }

  const [course, completed] = await Promise.all([
    prisma.course.findFirstOrThrow({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        subtitle: true,
        thumbnail: true,
        instructor: { select: { id: true, name: true } },
        sections: {
          where: { deletedAt: null },
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            title: true,
            lectures: {
              where: { deletedAt: null },
              orderBy: [{ position: 'asc' }, { id: 'asc' }],
              select: { id: true, title: true, durationSec: true, isPreview: true },
            },
          },
        },
      },
    }),
    prisma.lectureProgress.findMany({
      where: { userId, lecture: { section: { courseId } } },
      select: { lectureId: true },
    }),
  ])

  const completedIds = new Set(completed.map((p) => p.lectureId))
  let totalLectures = 0
  let completedLectures = 0
  // Gắn thêm cờ completed cho từng bài để frontend hiện dấu tích
  const sections = course.sections.map((section) => ({
    ...section,
    lectures: section.lectures.map((lecture) => {
      const isCompleted = completedIds.has(lecture.id)
      totalLectures++
      if (isCompleted) completedLectures++
      return { ...lecture, completed: isCompleted }
    }),
  }))

  return {
    enrolledAt: enrollment.createdAt,
    course: { ...course, sections },
    progress: toProgress({ totalLectures, completedLectures }),
  }
}

// Lấy bài giảng (còn hoạt động) + kiểm tra đã ghi danh khóa chứa bài đó
const getLectureOfEnrolledCourse = async (lectureId: number, userId: number) => {
  const lecture = await prisma.lecture.findFirst({
    where: { id: lectureId, deletedAt: null, section: { deletedAt: null, course: { deletedAt: null } } },
    select: { id: true, section: { select: { courseId: true } } },
  })
  if (!lecture) {
    throw new HttpError(404, 'Không tìm thấy bài giảng')
  }
  if (!(await isEnrolled(userId, lecture.section.courseId))) {
    throw new HttpError(403, 'Bạn chưa ghi danh khóa học này')
  }
  return lecture
}

// Đánh dấu đã học xong. upsert: bấm nhiều lần vẫn chỉ có 1 dòng
export const completeLecture = async (lectureId: number, userId: number) => {
  await getLectureOfEnrolledCourse(lectureId, userId)
  await prisma.lectureProgress.upsert({
    where: { userId_lectureId: { userId, lectureId } },
    create: { userId, lectureId },
    update: {},
  })
  return { lectureId, completed: true }
}

// Bỏ đánh dấu
export const uncompleteLecture = async (lectureId: number, userId: number) => {
  await getLectureOfEnrolledCourse(lectureId, userId)
  await prisma.lectureProgress.deleteMany({ where: { userId, lectureId } })
  return { lectureId, completed: false }
}
