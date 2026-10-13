import { Request, Response } from 'express'
import * as statsService from './stats.service'

export const getAdminStats = async (req: Request, res: Response) => {
  const stats = await statsService.getAdminStats()
  res.json({ message: 'Lấy thống kê thành công', data: stats })
}

export const getInstructorStats = async (req: Request, res: Response) => {
  const stats = await statsService.getInstructorStats(req.user!.userId)
  res.json({ message: 'Lấy thống kê thành công', data: stats })
}
