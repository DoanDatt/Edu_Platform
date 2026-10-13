import prisma from '../../lib/prisma'
import { HttpError, onUniqueViolation } from '../../utils/error'
import { CreatePermissionBodyType, GetPermissionQueryType, UpdatePermissionBodyType } from './permission.schema'

export const getPermission = async ({ page, limit }: GetPermissionQueryType) => {
  // chỉ lấy permission chưa bị xóa mềm
  const where = { deletedAt: null }
  // chạy song song 2  query: đếm tổng + lấy 1 trang
  const [totalItems, data] = await Promise.all([
    prisma.permission.count({
      where,
    }),
    prisma.permission.findMany({
      where,
      skip: (page - 1) * limit, // trang 1 bỏ qua 0, trang 2 bỏ qua 'limit'
      take: limit,
      orderBy: { id: 'asc' },
    }),
  ])
  return {
    data,
    totalItems,
    page,
    limit,
    totalPages: Math.ceil(totalItems / limit),
  }
}

export const getPermissionById = async (id: number) => {
  const permission = await prisma.permission.findFirst({
    where: { id, deletedAt: null },
  })
  if (!permission) {
    throw new HttpError(404, 'Không tìm thấy permission')
  }
  return permission
}
// không cho 2 permission còn hoạt động trùng cặp method + path
// excludeId: khi update thì bỏ qua chính nó (sửa name và giữ nguyên path vẫn hợp lệ)
const ensureNotDuplicate = async ({ path, method }: CreatePermissionBodyType, excludeId?: number) => {
  const existing = await prisma.permission.findFirst({
    where: {
      path,
      method,
      deletedAt: null,
      NOT: excludeId ? { id: excludeId } : undefined, //undefined = Prisma bỏ qua điều kiện này
    },
  })
  if (existing) {
    throw new HttpError(409, `Permission ${method} ${path} đã tồn tại`)
  }
}

export const createPermission = async (body: CreatePermissionBodyType, createdById: number) => {
  await ensureNotDuplicate(body)
  // ensureNotDuplicate cho thông báo rõ ràng; onUniqueViolation là chốt chặn cuối khi 2 request cùng lúc
  return onUniqueViolation(
    prisma.permission.create({
      data: { ...body, createdById },
    }),
    `Permission ${body.method} ${body.path} đã tồn tại`,
  )
}

export const updatePermission = async (id: number, body: UpdatePermissionBodyType, updatedById: number) => {
  await getPermissionById(id) // không có thì ném 404
  await ensureNotDuplicate(body, id)
  return onUniqueViolation(
    prisma.permission.update({
      where: { id },
      data: { ...body, updatedById },
    }),
    `Permission ${body.method} ${body.path} đã tồn tại`,
  )
}

export const deletePermission = async (id: number, deleteById: number) => {
  await getPermissionById(id)
  // xóa mềm: chỉ đánh dấu thời điểm xóa, dữ liệu còn trong DB
  await prisma.permission.update({
    where: { id },
    data: { deletedAt: new Date(), updatedById: deleteById },
  })
}
