import http from '@/lib/http'
import { AdminStatsResType, InstructorStatsResType } from '@/schemaValidations/stats.schema'

export const statsApiRequest = {
  instructor: () => http.get<InstructorStatsResType>('/stats/instructor'),
  admin: () => http.get<AdminStatsResType>('/stats/admin')
}
