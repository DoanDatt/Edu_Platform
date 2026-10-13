import { Router } from 'express'
import * as uploadController from './upload.controller'
import { requireAuth, requirePermission } from '../../middleware/auth.middleware'
import { uploadImage, uploadVideo } from '../../middleware/upload.middleware'

// Upload xong trả về { url }: frontend gửi tiếp url đó vào API khác
// (avatar ở PUT /profile, thumbnail ở PUT /courses/:id, videoUrl ở POST/PUT /lectures)
// requireAuth đặt ở TỪNG route, không dùng uploadRouter.use(requireAuth): router này chung prefix
// /uploads với file tĩnh, GET file không tồn tại sẽ rơi xuống đây → phải ra 404, không phải 401
const uploadRouter = Router()

// Ảnh (avatar, ảnh bìa): ai đăng nhập cũng upload được → không cần permission
uploadRouter.post('/image', requireAuth, uploadImage, uploadController.uploadImage)
// Video bài giảng: chỉ người có quyền (giảng viên, admin). requirePermission đặt TRƯỚC multer
// để người không có quyền bị chặn trước khi file nặng hàng trăm MB được ghi xuống đĩa
uploadRouter.post('/video', requireAuth, requirePermission, uploadVideo, uploadController.uploadVideo)

export default uploadRouter
