import { Request, Response } from 'express'
import { unlink } from 'fs/promises'
import path from 'path'
import envConfig from '../../config/env'
import { HttpError } from '../../utils/error'
import { hasValidSignature } from '../../utils/file-signature'

// Dùng chung cho ảnh và video: kiểm tra file đã lưu rồi trả link công khai
const handleUpload = (folder: 'images' | 'videos') => async (req: Request, res: Response) => {
  const file = req.file
  if (!file) {
    throw new HttpError(422, 'Dữ liệu không hợp lệ', [
      { field: 'file', message: 'Vui lòng chọn file (gửi multipart/form-data, field "file")' },
    ])
  }

  // Nội dung thật không khớp loại file khai báo → xóa file vừa lưu, báo lỗi
  if (!(await hasValidSignature(file.path, file.mimetype))) {
    await unlink(file.path).catch(() => undefined)
    throw new HttpError(422, 'Dữ liệu không hợp lệ', [
      { field: 'file', message: 'Nội dung file không đúng định dạng đã khai báo' },
    ])
  }

  const url = `${envConfig.PUBLIC_URL}/uploads/${folder}/${path.basename(file.path)}`
  res.status(201).json({
    message: 'Tải file lên thành công',
    data: { url, mimeType: file.mimetype, size: file.size, originalName: file.originalname },
  })
}

export const uploadImage = handleUpload('images')
export const uploadVideo = handleUpload('videos')
