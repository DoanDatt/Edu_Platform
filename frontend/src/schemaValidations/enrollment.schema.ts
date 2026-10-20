import z from 'zod'

// POST /enrollments: body gửi lên (copy từ backend CreateEnrollmentBodySchema)
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

// Response của POST /enrollments: { message, data: { id, userId, courseId, createdAt } }
export const EnrollmentRes = z.object({
  data: EnrollmentSchema,
  message: z.string()
})
export type EnrollmentResType = z.infer<typeof EnrollmentRes>
