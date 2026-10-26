import http from '@/lib/http'
import { InstructorStatsResType } from '@/schemaValidations/stats.schema'

export const statsApiRequest = {
  instructor: () => http.get<InstructorStatsResType>('/stats/instructor')
}
