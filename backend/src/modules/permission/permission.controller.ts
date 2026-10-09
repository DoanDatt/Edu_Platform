import { Request, Response } from 'express'
import {
  CreatePermissionBodyType,
  GetPermissionQueryType,
  PermissionParamsType,
  UpdatePermissionBodyType,
} from './permission.schema'
import * as permissionService from './permission.service'

export const getPermissions = async (req: Request, res: Response) => {
  const query = req.query as unknown as GetPermissionQueryType
  const result = await permissionService.getPermission(query)
  res.json({
    message: 'Lấy danh sách permission thành công',
    ...result,
  })
}

export const getPermissionById = async (req: Request, res: Response) => {
  const { permissionId } = req.params as unknown as PermissionParamsType
  const permission = await permissionService.getPermissionById(permissionId)
  res.json({
    message: 'Lấy permission thành công',
    data: permission,
  })
}

export const createPermission = async (req: Request, res: Response) => {
  const body = req.body as CreatePermissionBodyType
  const permission = await permissionService.createPermission(body, req.user!.userId)
  res.status(201).json({
    message: 'Tạo permission thành công',
    data: permission,
  })
}

export const updatePermission = async (req: Request, res: Response) => {
  const { permissionId } = req.params as unknown as PermissionParamsType
  const body = req.body as UpdatePermissionBodyType
  const permission = await permissionService.updatePermission(permissionId, body, req.user!.userId)
  res.json({
    message: 'Cập nhật permission thành công',
    data: permission,
  })
}

export const deletePermission = async (req: Request, res: Response) => {
  const { permissionId } = req.params as unknown as PermissionParamsType
  await permissionService.deletePermission(permissionId, req.user!.userId)
  res.json({
    message: 'Xóa permission thành công',
  })
}
