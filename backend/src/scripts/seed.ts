import envConfig from '../config/env'
import { RoleName } from '../constants/role'
import prisma from '../lib/prisma'
import { hashPassword } from '../utils/crypto'

const main = async () => {
  const roleCount = await prisma.role.count()
  if (roleCount > 0) {
    throw new Error('Roles đã tồn tài, không seed lại')
  }

  // Tạo 3 role
  const roles = await prisma.role.createMany({
    data: [
      { name: RoleName.Admin, description: 'Quản trị viên' },
      { name: RoleName.Instructor, description: 'Giảng viên' },
      { name: RoleName.Student, description: 'Học viên' },
    ],
  })

  // Lấy id của role Admin vừa tạo
  const adminRole = await prisma.role.findFirstOrThrow({
    where: { name: RoleName.Admin },
  })

  // Tạo tài khoản admin với mật khẩu  đã hash

  const adminUser = await prisma.user.create({
    data: {
      email: envConfig.ADMIN_EMAIL,
      password: await hashPassword(envConfig.ADMIN_PASSWORD),
      name: envConfig.ADMIN_NAME,
      phoneNumber: envConfig.ADMIN_PHONE_NUMBER,
      roleId: adminRole.id,
      status: 'ACTIVE',
    },
  })
  return { createdRoleCount: roles.count, adminUser }
}
main()
  .then(({ createdRoleCount, adminUser }) => {
    console.log(`Đã tạo ${createdRoleCount} role`)
    console.log(`Đã tạo admin: ${adminUser.email}`)
  })
  .catch(console.error)
  .finally(() => prisma.$disconnect())
