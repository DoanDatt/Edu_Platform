import { protectedRouters } from '../app'
import prisma from '../lib/prisma'
import { RoleName } from '../constants/role'
import { DEFAULT_ROLE_PERMISSIONS } from '../constants/default-permissions'
import { HTTPMethod } from '../generated/prisma/enums'
import { buildPermissionPath } from '../utils/permission-path'
import { requirePermission } from '../middleware/auth.middleware'

type RouteInfo = { method: HTTPMethod; path: string }

const HTTP_METHODS = Object.values(HTTPMethod) as string[]

// Đọc route từ router.stack của từng router trong protectedRouters
const collectRoutes = () => {
  const routes: RouteInfo[] = []
  for (const { prefix, router } of protectedRouters) {
    for (const layer of router.stack) {
      // Layer không có route = middleware (requireAuth, requireRole...) → bỏ qua
      if (!layer.route) continue
      // Chỉ đồng bộ route có gắn requirePermission. Route không khai không gắn thì bỏ qua
      const isProtected = (layer.route as unknown as { stack: { handle: unknown }[] }).stack.some(
        (l) => l.handle === requirePermission,
      )
      if (!isProtected) continue
      // route.methods dạng { get: true }. Type của Express không khai báo field này nên phải ép kiểu
      const methods = Object.keys((layer.route as unknown as { methods: Record<string, boolean> }).methods)
      for (const method of methods.map((m) => m.toUpperCase())) {
        if (!HTTP_METHODS.includes(method)) continue
        routes.push({ method: method as HTTPMethod, path: buildPermissionPath(prefix, layer.route.path) })
      }
    }
  }
  return routes
}

// "GET /roles/:roleId": dùng làm khoá để so sánh giữa code và DB
const toKey = ({ method, path }: RouteInfo) => `${method} ${path}`

const main = async () => {
  const routes = collectRoutes()
  const existing = await prisma.permission.findMany({ where: { deletedAt: null } })

  const routeKeys = new Set(routes.map(toKey))
  const existingKeys = new Set(existing.map(toKey))
  const toCreate = routes.filter((r) => !existingKeys.has(toKey(r)))
  const toDelete = existing.filter((p) => !routeKeys.has(toKey(p)))

  // Quyền mặc định khai báo sai (gõ nhầm, hoặc route đã bị xoá) → báo ngay để sửa
  const unknownDefaults = Object.values(DEFAULT_ROLE_PERMISSIONS)
    .flat()
    .filter((key) => !routeKeys.has(key))
  if (unknownDefaults.length > 0) {
    throw new Error(`DEFAULT_ROLE_PERMISSIONS có quyền không khớp route nào: ${unknownDefaults.join(', ')}`)
  }

  // npm run sync-permissions -- --dry → chỉ in ra, không ghi DB
  if (process.argv.includes('--dry')) {
    console.log('Sẽ tạo:', toCreate.map(toKey))
    console.log('Sẽ xoá:', toDelete.map(toKey))
    return
  }

  await prisma.permission.createMany({
    data: toCreate.map((r) => ({ name: toKey(r), method: r.method, path: r.path })),
  })
  await prisma.permission.updateMany({
    where: { id: { in: toDelete.map((p) => p.id) } },
    data: { deletedAt: new Date() },
  })

  // ADMIN luôn có toàn bộ permission đang hoạt động
  const allPermissions = await prisma.permission.findMany({ where: { deletedAt: null }, select: { id: true } })
  const adminRole = await prisma.role.findFirstOrThrow({ where: { name: RoleName.Admin, deletedAt: null } })
  await prisma.role.update({
    where: { id: adminRole.id },
    data: { permissions: { set: allPermissions } },
  })

  // Các role khác: THÊM quyền mặc định (connect), không gỡ quyền admin đã gán bằng tay
  for (const [roleName, keys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    if (keys.length === 0) continue
    const permissions = await prisma.permission.findMany({
      where: {
        deletedAt: null,
        OR: keys.map((key) => {
          const [method, path] = key.split(' ')
          return { method: method as HTTPMethod, path }
        }),
      },
      select: { id: true },
    })
    const role = await prisma.role.findFirstOrThrow({ where: { name: roleName, deletedAt: null } })
    await prisma.role.update({
      where: { id: role.id },
      data: { permissions: { connect: permissions } },
    })
  }

  console.log(`Đã tạo ${toCreate.length}, xoá ${toDelete.length} permission`)
  console.log(`ADMIN hiện có ${allPermissions.length} permission`)
  for (const [roleName, keys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    console.log(`${roleName}: đảm bảo có ${keys.length} quyền mặc định`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
