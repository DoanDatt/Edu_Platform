import envConfig from '../../config/env'
import { contactMessageEmail } from '../../emails/templates'
import prisma from '../../lib/prisma'
import { enqueueEmailSafely } from '../../queues/email.queue'
import { CreateContactBodyType } from './contact.schema'

// Tin nhắn từ trang Liên hệ: LƯU vào DB trước (email lỗi cũng không mất tin), rồi báo admin qua email.
// Email báo admin "có cũng được": hàng đợi lỗi chỉ ghi log, người gửi vẫn nhận thông báo thành công
export const createContactMessage = async ({ name, email, message }: CreateContactBodyType) => {
  const saved = await prisma.contactMessage.create({
    data: { name, email, message },
    select: { id: true, createdAt: true },
  })
  await enqueueEmailSafely({ to: envConfig.ADMIN_EMAIL, ...contactMessageEmail(name, email, message) })
  return saved
}
