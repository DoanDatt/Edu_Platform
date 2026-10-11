import { RoleName } from './role'

// Quyền của người học (học viên, và cả giảng viên khi đi học khóa của người khác)
const LEARNER_PERMISSIONS = [
  // Xem nội dung bài giảng (bài xem thử, khóa đã ghi danh, hoặc khóa mình dạy)
  'GET /lectures/:lectureId',
  // Ghi danh + khóa học của tôi + trang học
  'POST /enrollments',
  'GET /enrollments/mine',
  'GET /enrollments/mine/:courseId',
  // Đánh dấu học xong
  'POST /lectures/:lectureId/complete',
  'DELETE /lectures/:lectureId/complete',
]

// Quyền mặc định của từng role (ADMIN không cần: script sync luôn gán TẤT CẢ cho ADMIN).
// Mỗi dòng là "METHOD path" giống cột name của Permission do script sync sinh ra.
//
// Script sync chỉ THÊM các quyền này cho role (không gỡ quyền admin đã gán thêm bằng tay),
// nên DB mới dựng lại vẫn có đủ quyền, còn DB đang chạy thì không bị ghi đè.
// Thêm API mới cho giảng viên / học viên → thêm dòng tương ứng vào đây rồi chạy npm run sync-permissions
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  [RoleName.Instructor]: [
    // Khóa học của tôi
    'GET /courses/mine',
    'GET /courses/mine/:courseId',
    'POST /courses',
    'PUT /courses/:courseId',
    'DELETE /courses/:courseId',
    'POST /courses/:courseId/submit',
    // Soạn mục lục
    'POST /sections',
    'PUT /sections/:sectionId',
    'DELETE /sections/:sectionId',
    'POST /lectures',
    'PUT /lectures/:lectureId',
    'DELETE /lectures/:lectureId',
    ...LEARNER_PERMISSIONS,
  ],
  [RoleName.Student]: [...LEARNER_PERMISSIONS],
}
