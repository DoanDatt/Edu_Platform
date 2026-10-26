import http from '@/lib/http'
import { MessageResType } from '@/schemaValidations/common.schema'
import {
  CreateSectionBodyType,
  ReorderSectionsBodyType,
  SectionResType,
  UpdateSectionBodyType
} from '@/schemaValidations/section.schema'

// Không có API lấy danh sách chương: mục lục nằm sẵn trong GET /courses/mine/:id
const prefix = '/sections'

export const sectionApiRequest = {
  create: (body: CreateSectionBodyType) => http.post<SectionResType>(prefix, body),
  update: (id: number, body: UpdateSectionBodyType) => http.put<SectionResType>(`${prefix}/${id}`, body),
  delete: (id: number) => http.delete<MessageResType>(`${prefix}/${id}`),
  // Chỉ cần biết thành công hay không (xong thì tải lại cả mục lục) → không khai báo kiểu data trả về
  reorder: (body: ReorderSectionsBodyType) => http.put<MessageResType>(`${prefix}/reorder`, body)
}

export default sectionApiRequest
