import http from '@/lib/http'
import { ContactBodyType, ContactResType } from '@/schemaValidations/contact.schema'

const contactApiRequest = {
  // Gửi tin nhắn từ trang Liên hệ: backend lưu lại + email báo admin
  send: (body: ContactBodyType) => http.post<ContactResType>('/contact', body)
}

export default contactApiRequest
