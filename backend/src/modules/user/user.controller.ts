import { Request, Response } from 'express'
import * as userService from './user.service'
import { GetUsersQueryType, UpdateUserRoleBodyType, UpdateUserStatusBodyType, UserParamsType } from './user.schema'

export const getUsers = async (req: Request, res: Response) => {
  const result = await userService.getUsers(req.query as unknown as GetUsersQueryType)
  res.json({ message: 'Lấy danh sách người dùng thành công', ...result })
}

export const getUserById = async (req: Request, res: Response) => {
  const { userId } = req.params as unknown as UserParamsType
  const user = await userService.getUserById(userId)
  res.json({ message: 'Lấy người dùng thành công', data: user })
}

export const updateUserStatus = async (req: Request, res: Response) => {
  const { userId } = req.params as unknown as UserParamsType
  const user = await userService.updateUserStatus(userId, req.body as UpdateUserStatusBodyType, req.user!.userId)
  res.json({ message: 'Cập nhật trạng thái thành công', data: user })
}

export const updateUserRole = async (req: Request, res: Response) => {
  const { userId } = req.params as unknown as UserParamsType
  const user = await userService.updateUserRole(userId, req.body as UpdateUserRoleBodyType, req.user!.userId)
  res.json({ message: 'Cập nhật role thành công', data: user })
}
