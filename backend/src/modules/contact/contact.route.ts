import { Request, Response, Router } from 'express'
import { contactLimiter } from '../../middleware/rate-limit.middleware'
import { validateBody } from '../../middleware/validate.middleware'
import { CreateContactBodySchema, CreateContactBodyType } from './contact.schema'
import * as contactService from './contact.service'

const contactRouter = Router()

// Công khai: ai cũng gửi được, giới hạn 5 tin / giờ / IP (mỗi tin kéo theo 1 email cho admin)
contactRouter.post('/', contactLimiter, validateBody(CreateContactBodySchema), async (req: Request, res: Response) => {
  const saved = await contactService.createContactMessage(req.body as CreateContactBodyType)
  res.status(201).json({ message: 'Đã gửi tin nhắn, chúng tôi sẽ phản hồi qua email sớm nhất', data: saved })
})

export default contactRouter
