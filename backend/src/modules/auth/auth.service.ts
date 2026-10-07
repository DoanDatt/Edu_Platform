import { RoleName } from '../../constants/role'
import { Prisma } from '../../generated/prisma/client'
import prisma from '../../lib/prisma'
import { hashPassword } from '../../utils/crypto'
import { HttpError } from '../../utils/error'
import { RegisterBodyType } from './auth.schema'

export const register = async (body: RegisterBodyType) => {
  const studentRole = await prisma.role.findFirstOrThrow({
    where: { name: RoleName.Student },
  })
  try {
    return await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        phoneNumber: body.phoneNumber,
        password: await hashPassword(body.password),
        roleId: studentRole.id,
        status: 'ACTIVE',
      },
      // Không bao giờ trả password ra ngoài
      omit: {
        password: true,
        totpSecret: true,
      },
    })
  } catch (error) {
    // P2002 = vi phạm unique, ở đây là email đã tồn tại
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new HttpError(409, 'Email đã được sử dụng')
    }
    throw error
  }
}
