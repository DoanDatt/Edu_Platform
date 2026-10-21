import z from 'zod'

export const LectureSchema = z.object({
  id: z.number(),
  title: z.string(),
  videoUrl: z.string().nullable(),
  content: z.string(),
  durationSec: z.number(),

  section: z.object({
    id: z.number(),
    title: z.string(),
    course: z.object({
      id: z.number(),
      title: z.string(),
      status: z.string(),
      instructorId: z.number()
    })
  })
})

export type LectureType = z.infer<typeof LectureSchema>

export const LectureResSchema = z.object({
  data: LectureSchema,
  message: z.string()
})

export type LectureResType = z.infer<typeof LectureResSchema>

export const LectureCompleteSchema = z.object({
  lectureId: z.number(),
  completed: z.boolean()
})
export type LectureCompleteType = z.infer<typeof LectureCompleteSchema>

export const LectureCompleteRes = z.object({
  data: LectureCompleteSchema,
  message: z.string()
})

export type LectureCompleteResType = z.infer<typeof LectureCompleteRes>
