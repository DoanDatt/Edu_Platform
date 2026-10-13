export const TokenType = {
  ForgotPasswordToken: 'ForgotPasswordToken',
  AccessToken: 'AccessToken',
  RefreshToken: 'RefreshToken',
  TableToken: 'TableToken'
} as const

export const RoleValues = {
  Admin: 'ADMIN',
  Instructor: 'INSTRUCTOR',
  Student: 'STUDENT'
} as const

// Các enum dưới đây khớp với enum trong backend/prisma/schema.prisma,
// backend thêm giá trị mới thì nhớ thêm ở đây

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  BLOCKED: 'BLOCKED'
} as const

export const CourseLevel = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
  ALL_LEVELS: 'ALL_LEVELS'
} as const

export const CourseStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  PUBLISHED: 'PUBLISHED',
  REJECTED: 'REJECTED'
} as const

// Method của permission (trang quản trị phân quyền)
export const HTTPMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  OPTIONS: 'OPTIONS',
  HEAD: 'HEAD'
} as const
