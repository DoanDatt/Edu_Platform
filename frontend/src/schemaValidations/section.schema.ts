import z from 'zod'

export const PublicLectureSchema = z.object({
  id: z.number(),
  title: z.string(),
  durationSec: z.number(),
  isPreview: z.boolean(),
  videoUrl: z.string().nullable()
})

export type PublicLectureType = z.infer<typeof PublicLectureSchema>

export const PublicSectionSchema = z.object({
  id: z.number(),
  title: z.string(),
  lectures: z.array(PublicLectureSchema)
})
export type PublicSectionType = z.infer<typeof PublicSectionSchema>
