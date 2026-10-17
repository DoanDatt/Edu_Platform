export const TokenType = {
  ForgotPasswordToken: 'ForgotPasswordToken',
  AccessToken: 'AccessToken',
  RefreshToken: 'RefreshToken'
} as const

export const RoleValues = {
  Admin: 'ADMIN',
  Instructor: 'INSTRUCTOR',
  Student: 'STUDENT'
} as const

// 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'
export type RoleType = (typeof RoleValues)[keyof typeof RoleValues]

// Các enum dưới đây khớp với enum trong backend/prisma/schema.prisma,
// backend thêm giá trị mới thì nhớ thêm ở đây

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  BLOCKED: 'BLOCKED'
} as const

export const CourseLevel = {
  BEGINNER: 'BEGINNER',
  ALL_LEVELS: 'ALL_LEVELS',
  ADVANCED: 'ADVANCED',
  INTERMEDIATE: 'INTERMEDIATE'
} as const
