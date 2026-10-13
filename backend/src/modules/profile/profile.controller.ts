import { Request, Response } from 'express'
import * as profileService from './profile.service'
import { ChangePasswordBodyType, UpdateProfileBodyType } from './profile.schema'

export const getProfile = async (req: Request, res: Response) => {
  const profile = await profileService.getProfile(req.user!.userId)
  res.json({ message: 'Lấy hồ sơ thành công', data: profile })
}

export const updateProfile = async (req: Request, res: Response) => {
  const profile = await profileService.updateProfile(req.user!.userId, req.body as UpdateProfileBodyType)
  res.json({ message: 'Cập nhật hồ sơ thành công', data: profile })
}

export const changePassword = async (req: Request, res: Response) => {
  const tokens = await profileService.changePassword(
    req.user!.userId,
    req.body as ChangePasswordBodyType,
    req.user!.roleName,
  )
  res.json({ message: 'Đổi mật khẩu thành công, các thiết bị khác đã bị đăng xuất', data: tokens })
}
