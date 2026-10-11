import { RoleName } from './role'

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
    // Xem nội dung bài giảng (của khóa mình dạy, hoặc khóa đã ghi danh)
    'GET /lectures/:lectureId',
  ],
  [RoleName.Student]: [
    // Xem nội dung bài giảng (bài xem thử, hoặc khóa đã ghi danh)
    'GET /lectures/:lectureId',
  ],
}
