import prisma from '../../lib/prisma'
import { CourseStatus, OrderStatus, UserStatus } from '../../generated/prisma/enums'
import { Prisma } from '../../generated/prisma/client'

const DAY_MS = 24 * 60 * 60 * 1000

// Đổi kết quả groupBy [{ status: 'DRAFT', _count: { _all: 3 } }, ...] thành { DRAFT: 3, PENDING: 0, ... }
const countByStatus = (groups: { status: CourseStatus; _count: { _all: number } }[]) => {
  const result = Object.fromEntries(Object.values(CourseStatus).map((s) => [s, 0])) as Record<CourseStatus, number>
  for (const group of groups) result[group.status] = group._count._all
  return result
}

// ===== Doanh thu (chỉ tính đơn ĐÃ thanh toán) =====

const REVENUE_DAYS = 30
const TIME_ZONE = 'Asia/Ho_Chi_Minh'

// Ngày theo giờ Việt Nam dạng 'YYYY-MM-DD' (en-CA in ra đúng dạng này). Đơn trả lúc 23h ngày 1/10 giờ VN
// là 16h UTC → vẫn phải tính vào ngày 1/10, không bị nhảy sang ngày khác
const vnDateKey = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(date)

// Doanh thu + số đơn theo từng ngày trong 30 ngày gần nhất (đủ 30 phần tử, ngày không bán được → 0).
// instructorId: chỉ tính khóa của giảng viên đó; không truyền = toàn hệ thống
const getDailyRevenue = async (since: Date, instructorId?: number) => {
  // GROUP BY theo NGÀY giờ Việt Nam: paidAt lưu UTC → đổi sang giờ VN rồi cắt lấy ngày.
  // Prisma groupBy không nhóm theo ngày được → dùng SQL thuần ($queryRaw: tham số vẫn được escape an toàn)
  const instructorFilter = instructorId === undefined ? Prisma.empty : Prisma.sql`AND c."instructorId" = ${instructorId}`
  const rows = await prisma.$queryRaw<{ day: string; revenue: number; orders: number }[]>`
    SELECT to_char(o."paidAt" AT TIME ZONE 'UTC' AT TIME ZONE ${TIME_ZONE}, 'YYYY-MM-DD') AS day,
           SUM(o.amount)::int AS revenue,
           COUNT(*)::int AS orders
    FROM "Order" o
    JOIN "Course" c ON c.id = o."courseId"
    WHERE o.status = 'PAID' AND o."paidAt" >= ${since} ${instructorFilter}
    GROUP BY 1
    ORDER BY 1
  `
  const byDay = new Map(rows.map((row) => [row.day, row]))
  // Đủ 30 ngày liên tiếp (biểu đồ không bị hụt ngày không có đơn)
  return Array.from({ length: REVENUE_DAYS }, (_, index) => {
    const day = vnDateKey(new Date(Date.now() - (REVENUE_DAYS - 1 - index) * DAY_MS))
    return { date: day, revenue: byDay.get(day)?.revenue ?? 0, orders: byDay.get(day)?.orders ?? 0 }
  })
}

// Tổng doanh thu, doanh thu + số đơn 30 ngày, theo ngày, 5 khóa bán chạy nhất (theo doanh thu)
const getRevenue = async (instructorId?: number) => {
  const since = new Date(Date.now() - REVENUE_DAYS * DAY_MS)
  const paid: Prisma.OrderWhereInput = {
    status: OrderStatus.PAID,
    course: instructorId === undefined ? undefined : { instructorId },
  }
  const [all, recent, daily, topGroups] = await Promise.all([
    prisma.order.aggregate({ where: paid, _sum: { amount: true } }),
    prisma.order.aggregate({ where: { ...paid, paidAt: { gte: since } }, _sum: { amount: true }, _count: { _all: true } }),
    getDailyRevenue(since, instructorId),
    prisma.order.groupBy({
      by: ['courseId'],
      where: paid,
      _sum: { amount: true },
      _count: { _all: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 5,
    }),
  ])
  const courses = await prisma.course.findMany({
    where: { id: { in: topGroups.map((group) => group.courseId) } },
    select: { id: true, title: true },
  })
  const titleById = new Map(courses.map((course) => [course.id, course.title]))
  return {
    total: all._sum.amount ?? 0,
    last30Days: recent._sum.amount ?? 0,
    orders30Days: recent._count._all,
    daily,
    topCourses: topGroups.map((group) => ({
      id: group.courseId,
      title: titleById.get(group.courseId) ?? '',
      orders: group._count._all,
      revenue: group._sum.amount ?? 0,
    })),
  }
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
    revenue,
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
    getRevenue(),
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
    revenue,
  }
}

// Dashboard giảng viên: số liệu các khóa của CHÍNH MÌNH
export const getInstructorStats = async (instructorId: number) => {
  const myCourse = { instructorId, deletedAt: null }

  const [coursesByStatus, totalStudents, reviewAgg, topCourses, revenue] = await Promise.all([
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
    // Doanh thu chỉ từ các khóa của giảng viên này
    getRevenue(instructorId),
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
    revenue,
  }
}
