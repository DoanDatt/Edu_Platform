import { Request, Response } from 'express'
import * as sectionService from './section.service'
import { CreateSectionBodyType, SectionParamsType, UpdateSectionBodyType } from './section.schema'

export const createSection = async (req: Request, res: Response) => {
  const body = req.body as CreateSectionBodyType
  const section = await sectionService.createSection(body, req.user!.userId)
  res.status(201).json({ message: 'Tạo chương thành công', data: section })
}

export const updateSection = async (req: Request, res: Response) => {
  const { sectionId } = req.params as unknown as SectionParamsType
  const body = req.body as UpdateSectionBodyType
  const section = await sectionService.updateSection(sectionId, body, req.user!.userId)
  res.json({ message: 'Cập nhật chương thành công', data: section })
}

export const deleteSection = async (req: Request, res: Response) => {
  const { sectionId } = req.params as unknown as SectionParamsType
  await sectionService.deleteSection(sectionId, req.user!.userId)
  res.json({ message: 'Xóa chương thành công' })
}
