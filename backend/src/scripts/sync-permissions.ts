import { protectedRouters } from '../app'
import prisma from '../lib/prisma'
import { RoleName } from '../constants/role'
import { HTTPMethod } from '../generated/prisma/enums'
import { buildPermissionPath } from '../utils/permission-path'

type RouteInfo = { method: HTTPMethod; path: string }

const HTTP_METHODS = Object.values(HTTPMethod) as string[]

// Đọc route từ router.stack của từng router trong protectedRouters
const collectRoutes = () => {
  const routes: RouteInfo[] = []
  for (const { prefix, router } of protectedRouters) {
    for (const layer of router.stack) {
      // Layer không có route = middleware (requireAuth, requireRole...) → bỏ qua
      if (!layer.route) continue
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

  console.log(`Đã tạo ${toCreate.length}, xoá ${toDelete.length} permission`)
  console.log(`ADMIN hiện có ${allPermissions.length} permission`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
