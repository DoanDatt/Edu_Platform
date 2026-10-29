import prisma from '../../lib/prisma'
import { CourseStatus } from '../../generated/prisma/enums'
import { HttpError, onUniqueViolation } from '../../utils/error'
import { CreateCategoryBodyType, GetCategoriesQueryType, UpdateCategoryBodyType } from './category.schema'

// API công khai -> chỉ trả các field cần hiển thị, không lộ createdId, deletedAt
const categorySelect = { id: true, name: true, description: true } as const

export const getCategories = async ({ page, limit }: GetCategoriesQueryType) => {
  const where = {
    deletedAt: null,
  }
  const [totalItems, data] = await Promise.all([
    prisma.category.count({ where }),
    prisma.category.findMany({
      // cùng điều kiện với count
      where,
      // bỏ qua các trang trước
      skip: (page - 1) * limit,
      // chỉ lấy đúng 1 trang
      take: limit,
      // sắp xếp theo tên A -> Z
      orderBy: { name: 'asc' }, // danh mục hiển thị theo bảng chữ cái
      // id, name, description + số khóa ĐÃ XUẤT BẢN trong danh mục (ô danh mục ở trang chủ: "12 khóa học")
      select: {
        ...categorySelect,
        _count: { select: { courses: { where: { status: CourseStatus.PUBLISHED, deletedAt: null } } } },
      },
    }),
  ])
  return {
    data: data.map(({ _count, ...category }) => ({ ...category, courseCount: _count.courses })),
    totalItems,
    page,
    limit,
    totalPages: Math.ceil(totalItems / limit),
  }
}

export const getCategoryById = async (id: number) => {
  const category = await prisma.category.findFirst({
    where: { id, deletedAt: null },
    select: categorySelect,
  })
  if (!category) {
    throw new HttpError(404, 'Không tìm thấy danh mục')
  }
  return category
}

const ensureNameNotDuplicate = async (name: string, excludeId?: number) => {
  const existing = await prisma.category.findFirst({
    where: {
      // "Lập trình web" và "lập trình web" coi như là trùng
      // tên trùng không phân biệt là hoa hay thường
      name: { equals: name, mode: 'insensitive' },
      // chưa bị xóa
      deletedAt: null,
      // không phải chính nó
      NOT: excludeId ? { id: excludeId } : undefined,
    },
  })
  if (existing) {
    throw new HttpError(409, `Danh mục "${name}" đã tồn tại`)
  }
}

export const createCategory = async (body: CreateCategoryBodyType, createdById: number) => {
  await ensureNameNotDuplicate(body.name)
  return onUniqueViolation(
    prisma.category.create({
      data: {
        ...body,
        createdById,
      },
      select: categorySelect,
    }),
    `Danh mục "${body.name}" đã tồn tại`,
  )
}

export const updateCategory = async (id: number, body: UpdateCategoryBodyType, updatedById: number) => {
  await getCategoryById(id)
  await ensureNameNotDuplicate(body.name, id)
  return onUniqueViolation(
    prisma.category.update({
      where: { id },
      data: { ...body, updatedById },
      select: categorySelect,
    }),
    `Danh mục "${body.name}" đã tồn tại`,
  )
}

export const deleteCategory = async (id: number, deleteById: number) => {
  await getCategoryById(id)
  // Còn khóa học thì không cho xóa, giống role còn user
  const courseCount = await prisma.course.count({
    where: {
      categoryId: id,
      deletedAt: null,
    },
  })
  if (courseCount > 0) {
    throw new HttpError(
      409,
      `Còn ${courseCount} khóa học thuộc danh mục này, hãy chuyển chúng sang danh mục khác trước`,
    )
  }
  await prisma.category.update({
    where: { id },
    data: { deletedAt: new Date(), updatedById: deleteById },
  })
}
