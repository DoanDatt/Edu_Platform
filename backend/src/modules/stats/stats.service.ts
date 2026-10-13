import prisma from '../../lib/prisma'
import { CourseStatus, UserStatus } from '../../generated/prisma/enums'

const DAY_MS = 24 * 60 * 60 * 1000

// Đổi kết quả groupBy [{ status: 'DRAFT', _count: { _all: 3 } }, ...] thành { DRAFT: 3, PENDING: 0, ... }
const countByStatus = (groups: { status: CourseStatus; _count: { _all: number } }[]) => {
  const result = Object.fromEntries(Object.values(CourseStatus).map((s) => [s, 0])) as Record<CourseStatus, number>
  for (const group of groups) result[group.status] = group._count._all
  return result
}

// Dashboard admin: số liệu tổng của cả hệ thống
export const getAdminStats = async () => {
  const since = new Date(Date.now() - 30 * DAY_MS) // 30 ngày gần nhất
  const activeUser = { deletedAt: null }
  const activeCourse = { deletedAt: null }

  // Các query độc lập nhau → chạy song song
  const [
    totalUsers,
    blockedUsers,
    newUsers,
    usersByRole,
    roles,
    coursesByStatus,
    totalEnrollments,
    newEnrollments,
    reviewAgg,
  ] = await Promise.all([
    prisma.user.count({ where: activeUser }),
    prisma.user.count({ where: { ...activeUser, status: UserStatus.BLOCKED } }),
    prisma.user.count({ where: { ...activeUser, createdAt: { gte: since } } }),
    prisma.user.groupBy({ by: ['roleId'], where: activeUser, _count: { _all: true } }),
    prisma.role.findMany({ where: { deletedAt: null }, select: { id: true, name: true } }),
    prisma.course.groupBy({ by: ['status'], where: activeCourse, _count: { _all: true } }),
    prisma.enrollment.count(),
    prisma.enrollment.count({ where: { createdAt: { gte: since } } }),
    prisma.review.aggregate({ _avg: { rating: true }, _count: { _all: true } }),
  ])

  const byStatus = countByStatus(coursesByStatus)
  return {
    users: {
      total: totalUsers,
      blocked: blockedUsers,
      newLast30Days: newUsers,
      // { ADMIN: 1, INSTRUCTOR: 2, STUDENT: 10 }
      byRole: Object.fromEntries(
        roles.map((role) => [role.name, usersByRole.find((g) => g.roleId === role.id)?._count._all ?? 0]),
      ),
    },
    courses: {
      total: Object.values(byStatus).reduce((sum, n) => sum + n, 0),
      byStatus,
    },
    enrollments: { total: totalEnrollments, newLast30Days: newEnrollments },
    reviews: {
      total: reviewAgg._count._all,
      averageRating: Math.round((reviewAgg._avg.rating ?? 0) * 10) / 10,
    },
  }
}

// Dashboard giảng viên: số liệu các khóa của CHÍNH MÌNH
export const getInstructorStats = async (instructorId: number) => {
  const myCourse = { instructorId, deletedAt: null }

  const [coursesByStatus, totalStudents, reviewAgg, topCourses] = await Promise.all([
    prisma.course.groupBy({ by: ['status'], where: myCourse, _count: { _all: true } }),
    prisma.enrollment.count({ where: { course: myCourse } }),
    prisma.review.aggregate({ where: { course: myCourse }, _avg: { rating: true }, _count: { _all: true } }),
    // 5 khóa đông học viên nhất
    prisma.course.findMany({
      where: myCourse,
      orderBy: [{ enrollments: { _count: 'desc' } }, { id: 'desc' }],
      take: 5,
      select: { id: true, title: true, status: true, _count: { select: { enrollments: true, reviews: true } } },
    }),
  ])

  const byStatus = countByStatus(coursesByStatus)
  return {
    courses: {
      total: Object.values(byStatus).reduce((sum, n) => sum + n, 0),
      byStatus,
    },
    totalStudents,
    reviews: {
      total: reviewAgg._count._all,
      averageRating: Math.round((reviewAgg._avg.rating ?? 0) * 10) / 10,
    },
    topCourses: topCourses.map(({ _count, ...course }) => ({
      ...course,
      studentCount: _count.enrollments,
      reviewCount: _count.reviews,
    })),
  }
}
