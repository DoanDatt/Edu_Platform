import prisma from '../../lib/prisma'
import { HttpError } from '../../utils/error'
import { RoleName } from '../../constants/role'
import { CourseStatus } from '../../generated/prisma/enums'
import { AccessTokenPayload } from '../../utils/jwt'
import { getEditableOwnCourse } from '../course/course.service'
import { getEditableOwnSection } from '../section/section.service'
import { CreateLectureBodyType, UpdateLectureBodyType } from './lecture.schema'

// Bài giảng còn tồn tại + khóa học là của mình và còn sửa được
const getEditableOwnLecture = async (lectureId: number, instructorId: number) => {
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
  const { _max } = await prisma.lecture.aggregate({
    where: { sectionId, deletedAt: null },
    _max: { position: true },
  })
  return prisma.lecture.create({
    data: { ...data, sectionId, position: (_max.position ?? -1) + 1 },
  })
}

export const updateLecture = async (lectureId: number, body: UpdateLectureBodyType, instructorId: number) => {
  await getEditableOwnLecture(lectureId, instructorId)
  return prisma.lecture.update({
    where: { id: lectureId },
    data: body,
  })
}

export const deleteLecture = async (lectureId: number, instructorId: number) => {
  await getEditableOwnLecture(lectureId, instructorId)
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
    // TODO bước 8: cho người đã ghi danh xem mọi bài
    if (!lecture.isPreview) {
      throw new HttpError(403, 'Bạn cần ghi danh khóa học để xem bài giảng này')
    }
  }
  return lecture
}
