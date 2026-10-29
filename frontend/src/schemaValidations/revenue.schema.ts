import z from 'zod'

export const RevenueSchema = z.object({
  total: z.number(),
  last30Days: z.number(),
  orders30Days: z.number(),
  daily: z.array(
    z.object({
      date: z.string(),
      revenue: z.number(),
      orders: z.number()
    })
  ),
  topCourses: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      orders: z.number(),
      revenue: z.number()
    })
  )
})

export type RevenueType = z.infer<typeof RevenueSchema>
