import prisma from '../../lib/prisma'
import { RoleName } from '../../constants/role'
import { HttpError, onUniqueViolation } from '../../utils/error'
import { CreateRoleBodyType, GetRolesQueryType, UpdateRoleBodyType } from './role.schema'

// 3 role mà code đang dùng theo tên (requireRole(RoleName.Admin), register gán STUDENT...)
const SYSTEM_ROLES: string[] = Object.values(RoleName)

// Khi trả role về thì kèm danh sách permission (bỏ permission đã xoá mềm)
const permissionsInclude = {
  permissions: {
    where: { deletedAt: null },
    select: { id: true, name: true, method: true, path: true },
  },
} as const

export const getRoles = async ({ page, limit }: GetRolesQueryType) => {
  const where = { deletedAt: null }
  const [totalItems, data] = await Promise.all([
    prisma.role.count({ where }),
    prisma.role.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: 'asc' },
    }),
  ])
  return { data, totalItems, page, limit, totalPages: Math.ceil(totalItems / limit) }
}

export const getRoleById = async (id: number) => {
  const role = await prisma.role.findFirst({
    where: { id, deletedAt: null },
    include: permissionsInclude,
  })
  if (!role) {
    throw new HttpError(404, 'Không tìm thấy role')
  }
  return role
}

const ensureNameNotDuplicate = async (name: string, excludeId?: number) => {
  const existing = await prisma.role.findFirst({
    where: { name, deletedAt: null, NOT: excludeId ? { id: excludeId } : undefined },
  })
  if (existing) {
    throw new HttpError(409, `Role ${name} đã tồn tại`)
  }
}

// Mọi id trong permissionIds phải là permission có thật và chưa bị xoá
const ensurePermissionsExist = async (permissionIds: number[]) => {
  if (permissionIds.length === 0) return

  const found = await prisma.permission.findMany({
    where: { id: { in: permissionIds }, deletedAt: null },
    select: { id: true },
  })
  const foundIds = new Set(found.map((p) => p.id))
  const missingIds = permissionIds.filter((id) => !foundIds.has(id))

  if (missingIds.length > 0) {
    // Cùng định dạng với lỗi validate: { field, message }
    throw new HttpError(422, 'Dữ liệu không hợp lệ', [
      { field: 'permissionIds', message: `Permission không tồn tại: ${missingIds.join(', ')}` },
    ])
  }
}

export const createRole = async ({ permissionIds, ...data }: CreateRoleBodyType, createdById: number) => {
  await ensureNameNotDuplicate(data.name)
  await ensurePermissionsExist(permissionIds)

  return onUniqueViolation(
    prisma.role.create({
      data: {
        ...data, // name, description, isActive
        createdById,
        // connect: nối role mới với các permission có sẵn (ghi vào bảng trung gian)
        permissions: { connect: permissionIds.map((id) => ({ id })) },
      },
      include: permissionsInclude,
    }),
    `Role ${data.name} đã tồn tại`,
  )
}

export const updateRole = async (id: number, { permissionIds, ...data }: UpdateRoleBodyType, updatedById: number) => {
  const role = await getRoleById(id)

  // ADMIN luôn có toàn bộ quyền (bước 5d tự gán), không cho sửa tay để tránh admin tự khoá mình
  if (role.name === RoleName.Admin) {
    throw new HttpError(403, 'Không được sửa role ADMIN')
  }
  // INSTRUCTOR, STUDENT: được sửa mô tả và quyền, nhưng không được đổi tên hay tắt
  if (SYSTEM_ROLES.includes(role.name)) {
    if (data.name !== role.name) {
      throw new HttpError(403, 'Không được đổi tên role hệ thống')
    }
    if (data.isActive === false) {
      throw new HttpError(403, 'Không được tắt role hệ thống')
    }
  }

  await ensureNameNotDuplicate(data.name, id)
  await ensurePermissionsExist(permissionIds)

  return onUniqueViolation(
    prisma.role.update({
      where: { id },
      data: {
        ...data,
        updatedById,
        // set: XOÁ hết liên kết cũ rồi nối lại đúng danh sách mới
        permissions: { set: permissionIds.map((permissionId) => ({ id: permissionId })) },
      },
      include: permissionsInclude,
    }),
    `Role ${data.name} đã tồn tại`,
  )
}

export const deleteRole = async (id: number, deletedById: number) => {
  const role = await getRoleById(id)

  if (SYSTEM_ROLES.includes(role.name)) {
    throw new HttpError(403, 'Không được xoá role hệ thống')
  }
  // Xoá role đang có người dùng thì những user đó sẽ "mồ côi" role
  const userCount = await prisma.user.count({ where: { roleId: id, deletedAt: null } })
  if (userCount > 0) {
    throw new HttpError(409, `Còn ${userCount} user thuộc role này, hãy chuyển họ sang role khác trước`)
  }

  await prisma.role.update({
    where: { id },
    data: { deletedAt: new Date(), updatedById: deletedById },
  })
}
