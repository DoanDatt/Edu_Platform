import { CourseLevel } from '@/constants/type'
import z from 'zod'
import { PaginationRes } from './common.schema'
import { PublicLectureSchema } from './section.schema'

// Thứ tự trong file: TỪ TRONG RA NGOÀI. Schema nào dùng schema khác thì phải nằm DƯỚI schema đó
// (JavaScript chạy từ trên xuống, dùng biến trước khi khai báo sẽ lỗi "before initialization")

// ===== Ghi danh: POST /enrollments =====

// Body gửi lên (copy từ backend CreateEnrollmentBodySchema)
// Body JSON có kiểu thật → courseId là SỐ, dùng z.number() (KHÔNG coerce như query trên URL)
export const CreateEnrollmentBody = z
  .object({
    courseId: z.number().int().positive()
  })
  .strict()
export type CreateEnrollmentBodyType = z.infer<typeof CreateEnrollmentBody>

// Một bản ghi ghi danh, đúng như backend trả về
export const EnrollmentSchema = z.object({
  id: z.number(),
  userId: z.number(),
  courseId: z.number(),
  createdAt: z.string()
})
export type EnrollmentType = z.infer<typeof EnrollmentSchema>

// Response: { message, data: { id, userId, courseId, createdAt } }
export const EnrollmentRes = z.object({
  data: EnrollmentSchema,
  message: z.string()
})
export type EnrollmentResType = z.infer<typeof EnrollmentRes>

// ===== Mảnh dùng chung cho danh sách và chi tiết =====

// Tiến độ học 1 khóa (backend tính sẵn percent)
export const EnrollmentProgressSchema = z.object({
  totalLectures: z.number(),
  completedLectures: z.number(),
  percent: z.number()
})
export type EnrollmentProgressType = z.infer<typeof EnrollmentProgressSchema>

// Khóa học rút gọn trong "Khóa học của tôi" (không có giá, đánh giá như khóa công khai;
// instructor không có avatar). Không export vì chỉ dùng trong file này
const MyCourseSchema = z.object({
  id: z.number(),
  title: z.string(),
  subtitle: z.string(),
  thumbnail: z.string().nullable(),
  level: z.enum(CourseLevel),
  instructor: z.object({ id: z.number(), name: z.string() })
})

// ===== Danh sách: GET /enrollments/mine =====

// Một lần ghi danh: khóa học + tiến độ
export const MyEnrollmentSchema = z.object({
  enrolledAt: z.string(),
  course: MyCourseSchema,
  progress: EnrollmentProgressSchema
})
export type MyEnrollmentType = z.infer<typeof MyEnrollmentSchema>

export const MyEnrollmentListRes = PaginationRes.extend({
  data: z.array(MyEnrollmentSchema),
  message: z.string()
})
export type MyEnrollmentListResType = z.infer<typeof MyEnrollmentListRes>

// ===== Chi tiết: GET /enrollments/mine/:courseId (trang học) =====

// Bài giảng CỦA TÔI = bài công khai, bỏ videoUrl (video lấy riêng ở GET /lectures/:id),
// thêm completed (tôi đã học bài này chưa)
//   .omit: BỎ trường   .extend: THÊM trường
export const MyLectureSchema = PublicLectureSchema.omit({ videoUrl: true }).extend({
  completed: z.boolean()
})
export type MyLectureType = z.infer<typeof MyLectureSchema>

// Chương: chứa các bài có completed (dùng MyLectureSchema ở trên → phải nằm dưới nó)
export const MySectionSchema = z.object({
  id: z.number(),
  title: z.string(),
  lectures: z.array(MyLectureSchema)
})
export type MySectionType = z.infer<typeof MySectionSchema>

// Giống 1 phần tử của danh sách, chỉ khác course: bỏ level, thêm mục lục sections
export const MyEnrollmentDetailRes = z.object({
  data: MyEnrollmentSchema.extend({
    course: MyCourseSchema.omit({ level: true }).extend({
      sections: z.array(MySectionSchema)
    })
  }),
  message: z.string()
})
export type MyEnrollmentDetailResType = z.infer<typeof MyEnrollmentDetailRes>
