import { Request, Response } from 'express'
import * as roleService from './role.service'
import { CreateRoleBodyType, GetRolesQueryType, RoleParamsType, UpdateRoleBodyType } from './role.schema'

export const getRoles = async (req: Request, res: Response) => {
  const query = req.query as unknown as GetRolesQueryType
  const result = await roleService.getRoles(query)
  res.json({ message: 'Lấy danh sách role thành công', ...result })
}

export const getRoleById = async (req: Request, res: Response) => {
  const { roleId } = req.params as unknown as RoleParamsType
  const role = await roleService.getRoleById(roleId)
  res.json({ message: 'Lấy role thành công', data: role })
}

export const createRole = async (req: Request, res: Response) => {
  const body = req.body as CreateRoleBodyType
  const role = await roleService.createRole(body, req.user!.userId)
  res.status(201).json({ message: 'Tạo role thành công', data: role })
}

export const updateRole = async (req: Request, res: Response) => {
  const { roleId } = req.params as unknown as RoleParamsType
  const body = req.body as UpdateRoleBodyType
  const role = await roleService.updateRole(roleId, body, req.user!.userId)
  res.json({ message: 'Cập nhật role thành công', data: role })
}

export const deleteRole = async (req: Request, res: Response) => {
  const { roleId } = req.params as unknown as RoleParamsType
  await roleService.deleteRole(roleId, req.user!.userId)
  res.json({ message: 'Xoá role thành công' })
}
