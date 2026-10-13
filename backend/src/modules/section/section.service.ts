import prisma from '../../lib/prisma'
import { HttpError } from '../../utils/error'
import { hasExactlyIds } from '../../utils/ids'
import { ensurePublishedCourseKeepsLectures, getEditableOwnCourse } from '../course/course.service'
import { CreateSectionBodyType, ReorderSectionsBodyType, UpdateSectionBodyType } from './section.schema'

// Chương còn tồn tại + khóa học là của mình và còn sửa được.
// Dùng cho sửa/xóa chương và tạo bài giảng trong chương
export const getEditableOwnSection = async (sectionId: number, instructorId: number) => {
  const section = await prisma.section.findFirst({
    where: { id: sectionId, deletedAt: null },
  })
  if (!section) {
    throw new HttpError(404, 'Không tìm thấy chương')
  }
  await getEditableOwnCourse(section.courseId, instructorId) // 404 / 403 / 409
  return section
}

export const createSection = async ({ courseId, title }: CreateSectionBodyType, instructorId: number) => {
  await getEditableOwnCourse(courseId, instructorId)

  // Chương mới luôn nằm cuối: position = vị trí lớn nhất hiện có + 1
  const { _max } = await prisma.section.aggregate({
    where: { courseId, deletedAt: null },
    _max: { position: true },
  })
  return prisma.section.create({
    data: { courseId, title, position: (_max.position ?? -1) + 1 },
  })
}

export const updateSection = async (sectionId: number, body: UpdateSectionBodyType, instructorId: number) => {
  await getEditableOwnSection(sectionId, instructorId)
  return prisma.section.update({
    where: { id: sectionId },
    data: body,
  })
}

// Đổi thứ tự TẤT CẢ chương của 1 khóa trong 1 lần (frontend kéo thả xong gửi lên)
export const reorderSections = async ({ courseId, sectionIds }: ReorderSectionsBodyType, instructorId: number) => {
  await getEditableOwnCourse(courseId, instructorId)
  const sections = await prisma.section.findMany({
    where: { courseId, deletedAt: null },
    select: { id: true },
  })
  const currentIds = sections.map((s) => s.id)
  if (!hasExactlyIds(sectionIds, currentIds)) {
    throw new HttpError(422, 'Dữ liệu không hợp lệ', [
      { field: 'sectionIds', message: 'Phải gửi đúng và đủ tất cả chương hiện có của khóa học' },
    ])
  }
  // Vị trí mới = thứ tự trong mảng. Nhiều lệnh update → gom vào 1 transaction
  await prisma.$transaction(
    sectionIds.map((id, index) => prisma.section.update({ where: { id }, data: { position: index } })),
  )
  return prisma.section.findMany({
    where: { courseId, deletedAt: null },
    orderBy: [{ position: 'asc' }, { id: 'asc' }],
  })
}

export const deleteSection = async (sectionId: number, instructorId: number) => {
  const section = await getEditableOwnSection(sectionId, instructorId)
  // Khóa đã xuất bản: xóa chương này mà khóa hết sạch bài thì không cho
  await ensurePublishedCourseKeepsLectures(section.courseId, { sectionId })
  const now = new Date()
  // Xóa chương thì xóa luôn các bài giảng bên trong.
  // $transaction: 2 lệnh cùng thành công hoặc cùng thất bại
  await prisma.$transaction([
    prisma.lecture.updateMany({ where: { sectionId, deletedAt: null }, data: { deletedAt: now } }),
    prisma.section.update({ where: { id: sectionId }, data: { deletedAt: now } }),
  ])
}
