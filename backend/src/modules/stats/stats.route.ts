import { Router } from 'express'
import * as statsController from './stats.controller'
import { requireAuth, requirePermission } from '../../middleware/auth.middleware'

// Số liệu cho trang dashboard
const statsRouter = Router()
statsRouter.use(requireAuth)

statsRouter.get('/admin', requirePermission, statsController.getAdminStats)
statsRouter.get('/instructor', requirePermission, statsController.getInstructorStats)

export default statsRouter
