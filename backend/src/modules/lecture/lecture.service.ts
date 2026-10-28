import prisma from '../../lib/prisma'
import { HttpError } from '../../utils/error'
import { RoleName } from '../../constants/role'
import { CourseStatus } from '../../generated/prisma/enums'
import { AccessTokenPayload } from '../../utils/jwt'
import { hasExactlyIds } from '../../utils/ids'
import { ensurePublishedCourseKeepsLectures, getEditableOwnCourse } from '../course/course.service'
import { getEditableOwnSection } from '../section/section.service'
import { isEnrolled, requiredWatchSec } from '../enrollment/enrollment.service'
import { CreateLectureBodyType, ReorderLecturesBodyType, UpdateLectureBodyType } from './lecture.schema'

// Vị trí cuối cùng trong chương (để thêm bài mới / chuyển bài sang vào cuối)
const nextPositionInSection = async (sectionId: number) => {
  const { _max } = await prisma.lecture.aggregate({
    where: { sectionId, deletedAt: null },
    _max: { position: true },
  })
  return (_max.position ?? -1) + 1
}

// Bài giảng còn tồn tại + khóa học là của mình và còn sửa được
export const getEditableOwnLecture = async (lectureId: number, instructorId: number) => {
  const lecture = await prisma.lecture.findFirst({
    where: { id: lectureId, deletedAt: null, section: { deletedAt: null } },
    include: { section: { select: { courseId: true } } },
  })
  if (!lecture) {
    throw new HttpError(404, 'Không tìm thấy bài giảng')
  }
  await getEditableOwnCourse(lecture.section.courseId, instructorId) // 404 / 403 / 409
  return lecture
}

export const createLecture = async ({ sectionId, ...data }: CreateLectureBodyType, instructorId: number) => {
  await getEditableOwnSection(sectionId, instructorId)
  // Bài mới luôn nằm cuối chương
  return prisma.lecture.create({
    data: { ...data, sectionId, position: await nextPositionInSection(sectionId) },
  })
}

export const updateLecture = async (
  lectureId: number,
  { sectionId, position, ...data }: UpdateLectureBodyType,
  instructorId: number,
) => {
  const lecture = await getEditableOwnLecture(lectureId, instructorId)

  // Chuyển chương: chương đích phải còn tồn tại và thuộc CÙNG khóa học
  const isMoving = sectionId !== undefined && sectionId !== lecture.sectionId
  if (isMoving) {
    const target = await prisma.section.findFirst({ where: { id: sectionId, deletedAt: null } })
    if (!target || target.courseId !== lecture.section.courseId) {
      throw new HttpError(422, 'Dữ liệu không hợp lệ', [
        { field: 'sectionId', message: 'Chương đích không tồn tại hoặc không thuộc khóa học này' },
      ])
    }
  }

  return prisma.lecture.update({
    where: { id: lectureId },
    data: {
      ...data,
      sectionId: isMoving ? sectionId : undefined,
      // Chuyển chương mà không chỉ định vị trí → nằm cuối chương mới
      position: position ?? (isMoving ? await nextPositionInSection(sectionId) : undefined),
    },
  })
}

// Đổi thứ tự TẤT CẢ bài trong 1 chương trong 1 lần
export const reorderLectures = async ({ sectionId, lectureIds }: ReorderLecturesBodyType, instructorId: number) => {
  await getEditableOwnSection(sectionId, instructorId)
  const lectures = await prisma.lecture.findMany({
    where: { sectionId, deletedAt: null },
    select: { id: true },
  })
  const currentIds = lectures.map((l) => l.id)
  if (!hasExactlyIds(lectureIds, currentIds)) {
    throw new HttpError(422, 'Dữ liệu không hợp lệ', [
      { field: 'lectureIds', message: 'Phải gửi đúng và đủ tất cả bài giảng hiện có của chương' },
    ])
  }
  await prisma.$transaction(
    lectureIds.map((id, index) => prisma.lecture.update({ where: { id }, data: { position: index } })),
  )
  return prisma.lecture.findMany({
    where: { sectionId, deletedAt: null },
    orderBy: [{ position: 'asc' }, { id: 'asc' }],
  })
}

export const deleteLecture = async (lectureId: number, instructorId: number) => {
  const lecture = await getEditableOwnLecture(lectureId, instructorId)
  // Khóa đã xuất bản: không được xóa bài cuối cùng
  await ensurePublishedCourseKeepsLectures(lecture.section.courseId, { id: lectureId })
  await prisma.lecture.update({
    where: { id: lectureId },
    data: { deletedAt: new Date() },
  })
}

// Xem NỘI DUNG bài giảng (video, bài viết). Ai được xem:
//  - giảng viên của khóa / admin: luôn được (để soạn và duyệt)
//  - người khác: khóa phải PUBLISHED, và bài là bài xem thử HOẶC đã ghi danh khóa
export const getLectureForLearner = async (lectureId: number, user: AccessTokenPayload) => {
  const lecture = await prisma.lecture.findFirst({
    where: {
      id: lectureId,
      deletedAt: null,
      section: { deletedAt: null, course: { deletedAt: null } },
    },
    include: {
      section: {
        select: {
          id: true,
          title: true,
          course: { select: { id: true, title: true, status: true, instructorId: true } },
        },
      },
      _count: { select: { quizQuestions: true } },
    },
  })
  if (!lecture) {
    throw new HttpError(404, 'Không tìm thấy bài giảng')
  }

  const { course } = lecture.section
  const isOwnerOrAdmin = course.instructorId === user.userId || user.roleName === RoleName.Admin
  if (!isOwnerOrAdmin) {
    if (course.status !== CourseStatus.PUBLISHED) {
      throw new HttpError(404, 'Không tìm thấy bài giảng')
    }
    if (!lecture.isPreview && !(await isEnrolled(user.userId, course.id))) {
      throw new HttpError(403, 'Bạn cần ghi danh khóa học để xem bài giảng này')
    }
  }

  // Đã xem tới đâu (chưa xem lần nào → null): trình phát tua tới positionSec để xem tiếp
  const watch = await prisma.lectureWatch.findUnique({
    where: { userId_lectureId: { userId: user.userId, lectureId } },
    select: { watchedSec: true, positionSec: true },
  })
  const { _count, ...rest } = lecture
  return {
    ...rest,
    hasQuiz: _count.quizQuestions > 0,
    watch,
    // Số giây phải xem để tính là học xong (0 = bài không có video / chưa biết thời lượng → tự bấm "đã học")
    requiredWatchSec: lecture.videoUrl && lecture.durationSec > 0 ? requiredWatchSec(lecture.durationSec) : 0,
  }
}
