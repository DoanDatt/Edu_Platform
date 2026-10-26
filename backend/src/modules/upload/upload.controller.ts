import { Request, Response } from 'express'
import { unlink } from 'fs/promises'
import path from 'path'
import envConfig from '../../config/env'
import { isCloudinaryEnabled, uploadToCloudinary } from '../../lib/cloudinary'
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

  const info = { mimeType: file.mimetype, size: file.size, originalName: file.originalname }

  // Có Cloudinary (deploy): đẩy file lên Cloudinary rồi XÓA file tạm trên đĩa
  if (isCloudinaryEnabled) {
    try {
      const { url, durationSec } = await uploadToCloudinary(file.path, folder)
      res.status(201).json({ message: 'Tải file lên thành công', data: { url, durationSec, ...info } })
    } catch (error) {
      console.error('Upload Cloudinary lỗi:', error)
      throw new HttpError(502, 'Không tải được file lên kho lưu trữ, vui lòng thử lại')
    } finally {
      await unlink(file.path).catch(() => undefined)
    }
    return
  }

  // Không có Cloudinary (máy local, test): giữ file trên đĩa, phục vụ qua /uploads/...
  const url = `${envConfig.PUBLIC_URL}/uploads/${folder}/${path.basename(file.path)}`
  res.status(201).json({ message: 'Tải file lên thành công', data: { url, ...info } })
}

export const uploadImage = handleUpload('images')
export const uploadVideo = handleUpload('videos')
