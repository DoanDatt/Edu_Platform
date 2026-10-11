import { Request, Response } from 'express'
import {
  CategoryParamsType,
  CreateCategoryBodyType,
  GetCategoriesQueryType,
  UpdateCategoryBodyType,
} from './category.schema'
import * as categoryService from './category.service'

export const getCategories = async (req: Request, res: Response) => {
  const query = req.query as unknown as GetCategoriesQueryType
  const result = await categoryService.getCategories(query)
  res.json({
    message: 'Lấy danh sách danh mục thành công',
    ...result,
  })
}

export const getCategoryById = async (req: Request, res: Response) => {
  const { categoryId } = req.params as unknown as CategoryParamsType
  const category = await categoryService.getCategoryById(categoryId)
  res.json({
    message: 'Lấy danh mục thành công',
    data: category,
  })
}

export const createCategory = async (req: Request, res: Response) => {
  const body = req.body as CreateCategoryBodyType
  const category = await categoryService.createCategory(body, req.user!.userId)
  res.status(201).json({
    message: 'Tạo danh mục thành công',
    data: category,
  })
}

export const updateCategory = async (req: Request, res: Response) => {
  const { categoryId } = req.params as unknown as CategoryParamsType
  const body = req.body as UpdateCategoryBodyType
  const category = await categoryService.updateCategory(categoryId, body, req.user!.userId)
  res.json({
    message: 'Cập nhật danh mục thành công',
    data: category,
  })
}

export const deleteCategory = async (req: Request, res: Response) => {
  const { categoryId } = req.params as unknown as CategoryParamsType
  await categoryService.deleteCategory(categoryId, req.user!.userId)
  res.json({
    message: 'Xóa danh mục thành công',
  })
}
