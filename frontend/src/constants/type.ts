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

// Tên vai trò tiếng Việt để hiển thị (trang hồ sơ, sau này bảng người dùng của admin)
export const RoleLabels: Record<RoleType, string> = {
  ADMIN: 'Quản trị viên',
  INSTRUCTOR: 'Giảng viên',
  STUDENT: 'Học viên'
}

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

// Nhãn tiếng Việt để hiển thị. Record<...>: bắt buộc có đủ nhãn cho MỌI trình độ trong CourseLevel,
// backend thêm trình độ mới mà quên thêm nhãn ở đây → TypeScript báo lỗi
export const CourseLevelLabels: Record<keyof typeof CourseLevel, string> = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
  ALL_LEVELS: 'Mọi trình độ'
}

export const CourseStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  PUBLISHED: 'PUBLISHED',
  REJECTED: 'REJECTED'
} as const

export const CourseStatusLabels: Record<keyof typeof CourseStatus, string> = {
  DRAFT: 'Nháp',
  PENDING: 'Chờ duyệt',
  PUBLISHED: 'Đã xuất bản',
  REJECTED: 'Bị từ chối'
}

// Loại thông báo (khớp enum NotificationType của backend)
export const NotificationType = {
  COURSE_SUBMITTED: 'COURSE_SUBMITTED',
  COURSE_APPROVED: 'COURSE_APPROVED',
  COURSE_REJECTED: 'COURSE_REJECTED',
  COURSE_UNPUBLISHED: 'COURSE_UNPUBLISHED',
  NEW_ENROLLMENT: 'NEW_ENROLLMENT',
  NEW_REVIEW: 'NEW_REVIEW'
} as const
